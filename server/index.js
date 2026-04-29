import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { MongoClient } from 'mongodb';
import { pipeline, env } from '@xenova/transformers';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'amazon_reviews';

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI environment variable is not set.');
  process.exit(1);
}

env.allowLocalModels = false;

// ---------------------------------------------------------------------------
// MongoDB
// ---------------------------------------------------------------------------
const mongoClient = new MongoClient(MONGO_URI);
let db;

// ---------------------------------------------------------------------------
// Product name cache  (ASIN → human-readable product name)
// Loaded from the 'products' collection at startup, refreshed on demand.
// Falls back to the raw ASIN if no name is found.
// ---------------------------------------------------------------------------
let _productsMap = new Map();

async function loadProductsMap() {
  try {
    const col = db.collection('products');
    const docs = await col.find({}, { projection: { asin: 1, productName: 1 } }).toArray();
    _productsMap = new Map(docs.map((d) => [d.asin, d.productName || d.asin]));
    console.log(`Product name cache loaded: ${_productsMap.size} entries`);
  } catch (err) {
    console.warn('Could not load products map (collection may not exist yet):', err.message);
    _productsMap = new Map();
  }
}

function getProductName(asin) {
  return _productsMap.get(asin) || asin;
}

async function connectMongo() {
  await mongoClient.connect();
  db = mongoClient.db(DB_NAME);
  console.log(`MongoDB connected - database: ${DB_NAME}`);
  await loadProductsMap();
}

// ---------------------------------------------------------------------------
// Embedding model (lazy-loaded singleton)
// ---------------------------------------------------------------------------
let _embedder = null;
async function getEmbedder() {
  if (!_embedder) {
    console.log('Loading sentence-transformer model...');
    _embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
    console.log('Model ready.');
  }
  return _embedder;
}

// ---------------------------------------------------------------------------
// Embeddings cache
// ---------------------------------------------------------------------------
let _embeddingsCache = null;
async function getEmbeddingsCache() {
  if (_embeddingsCache) return _embeddingsCache;

  const cursor = db.collection('embeddings').find(
    {},
    { projection: { review_id: 1, embedding: 1 } }
  );
  const reviewIds = [];
  const vectors = [];
  for await (const doc of cursor) {
    reviewIds.push(doc.review_id);
    vectors.push(doc.embedding);
  }
  const dim = vectors.length > 0 ? vectors[0].length : 0;
  const matrix = new Float32Array(vectors.length * dim);
  for (let i = 0; i < vectors.length; i++) matrix.set(vectors[i], i * dim);

  _embeddingsCache = { reviewIds, matrix, dim, count: vectors.length };
  console.log(`Embeddings cache built: ${vectors.length} vectors (dim=${dim})`);
  return _embeddingsCache;
}

async function embed(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return new Float32Array(output.data);
}

// ---------------------------------------------------------------------------
// Polarity helpers
// distilbert-sst-2 emits sentiment_label (POSITIVE|NEGATIVE) plus a
// confidence score in [0,1]. We convert that into a signed polarity
// in [-1,1] for aggregation. Fallback to overall rating when missing.
// ---------------------------------------------------------------------------
function polarity(review) {
  const label = (review.sentiment_label || '').toUpperCase();
  const score = typeof review.sentiment_score === 'number' ? review.sentiment_score : null;
  if (score === null) {
    if (typeof review.overall === 'number') return (review.overall - 3) / 2;
    return 0;
  }
  if (label === 'NEGATIVE') return -score;
  if (label === 'POSITIVE') return score;
  if (typeof review.overall === 'number') return (review.overall - 3) / 2;
  return 0;
}

function bucketLabel(p) {
  if (p >= 0.25) return 'positive';
  if (p <= -0.25) return 'negative';
  return 'neutral';
}

function reviewDate(r) {
  if (typeof r.unixReviewTime === 'number') return new Date(r.unixReviewTime * 1000);
  if (r.reviewTime) {
    const d = new Date(r.reviewTime);
    if (!isNaN(d)) return d;
  }
  try {
    if (r._id && typeof r._id.getTimestamp === 'function') return r._id.getTimestamp();
  } catch (_) { /* ignore */ }
  return null;
}

function reviewText(r) {
  return r.reviewText || r.text || r.cleaned_text || '';
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------
async function getReviewsForAsin(asin, projection) {
  const proj = projection || {
    asin: 1, sentiment_label: 1, sentiment_score: 1, cluster_label: 1,
    overall: 1, reviewText: 1, text: 1, unixReviewTime: 1, reviewTime: 1,
  };
  return db.collection('reviews').find({ asin }, { projection: proj }).toArray();
}

function summariseProduct(asin, reviews) {
  const total = reviews.length;
  if (total === 0) {
    return {
      asin, productName: getProductName(asin), total: 0, avgRating: null, avgPolarity: 0,
      distribution: { positive: 0, neutral: 0, negative: 0 }, topThemes: [],
    };
  }
  let sumP = 0, sumR = 0, nR = 0;
  const dist = { positive: 0, neutral: 0, negative: 0 };
  const themes = new Map();
  for (const r of reviews) {
    const p = polarity(r);
    sumP += p;
    dist[bucketLabel(p)]++;
    if (typeof r.overall === 'number') { sumR += r.overall; nR++; }
    const t = r.cluster_label || 'Uncategorised';
    const e = themes.get(t) || { count: 0, sumP: 0 };
    e.count++; e.sumP += p;
    themes.set(t, e);
  }
  const topThemes = [...themes.entries()]
    .map(([label, v]) => ({ label, count: v.count, avgPolarity: v.sumP / v.count }))
    .sort((a, b) => b.count - a.count);
  return {
    asin, productName: getProductName(asin), total,
    avgRating: nR ? +(sumR / nR).toFixed(2) : null,
    avgPolarity: +(sumP / total).toFixed(3),
    distribution: dist,
    topThemes,
  };
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST'] }));

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// ---------------------------------------------------------------------------
// Existing routes
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({ message: 'SRIS backend is running', version: '2.0' });
});

// Reload product names without restarting the server
// POST /products/reload-names
app.post('/products/reload-names', async (_req, res) => {
  try {
    await loadProductsMap();
    res.json({ ok: true, count: _productsMap.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/test-db', async (_req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    res.json({ collections: collections.map((c) => c.name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/search', searchLimiter, async (req, res) => {
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required.' });

  try {
    const cache = await getEmbeddingsCache();
    if (cache.count === 0) return res.json([]);

    const queryVec = await embed(q);
    const { reviewIds, matrix, dim, count } = cache;
    const scores = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      let dot = 0;
      const offset = i * dim;
      for (let d = 0; d < dim; d++) dot += matrix[offset + d] * queryVec[d];
      scores[i] = dot;
    }
    const indices = Array.from({ length: count }, (_, i) => i)
      .sort((a, b) => scores[b] - scores[a])
      .slice(0, limit);

    const topIds = indices.map((i) => reviewIds[i]);
    const topScoreMap = new Map(indices.map((i) => [String(reviewIds[i]), scores[i]]));

    const reviews = await db
      .collection('reviews')
      .find({ _id: { $in: topIds } })
      .toArray();

    const results = reviews
      .map((r) => ({
        _id: String(r._id),
        reviewText: reviewText(r),
        asin: r.asin || '',
        productName: getProductName(r.asin || ''),
        sentiment_label: r.sentiment_label,
        sentiment_score: r.sentiment_score,
        polarity: polarity(r),
        cluster_label: r.cluster_label,
        overall: r.overall,
        score: topScoreMap.get(String(r._id)) ?? 0,
      }))
      .sort((a, b) => b.score - a.score);

    res.json(results);
  } catch (err) {
    console.error('/search error:', err);
    res.status(500).json({ error: 'Search failed: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /overview
// ---------------------------------------------------------------------------
app.get('/overview', async (_req, res) => {
  try {
    const reviews = db.collection('reviews');
    const total = await reviews.estimatedDocumentCount();
    const distinctAsins = await reviews.distinct('asin');
    const cursor = reviews.find({}, { projection: { sentiment_label: 1, sentiment_score: 1, overall: 1, cluster_label: 1 } });
    let pos = 0, neu = 0, neg = 0, sumP = 0, n = 0, sumRating = 0, nR = 0;
    const themes = new Map();
    for await (const r of cursor) {
      const p = polarity(r);
      sumP += p; n++;
      const b = bucketLabel(p);
      if (b === 'positive') pos++; else if (b === 'negative') neg++; else neu++;
      if (typeof r.overall === 'number') { sumRating += r.overall; nR++; }
      if (r.cluster_label) themes.set(r.cluster_label, (themes.get(r.cluster_label) || 0) + 1);
    }
    const topThemes = [...themes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }));
    res.json({
      total,
      products: distinctAsins.length,
      avgPolarity: n ? +(sumP / n).toFixed(3) : 0,
      avgRating: nR ? +(sumRating / nR).toFixed(2) : null,
      distribution: { positive: pos, neutral: neu, negative: neg },
      topThemes,
    });
  } catch (err) {
    console.error('/overview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /products
// ---------------------------------------------------------------------------
app.get('/products', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  try {
    const pipelineAgg = [
      { $group: {
          _id: '$asin',
          count: { $sum: 1 },
          avgRating: { $avg: '$overall' },
          posCount: { $sum: { $cond: [{ $eq: ['$sentiment_label', 'POSITIVE'] }, 1, 0] } },
          negCount: { $sum: { $cond: [{ $eq: ['$sentiment_label', 'NEGATIVE'] }, 1, 0] } },
      } },
      { $project: {
          _id: 0,
          asin: '$_id',
          count: 1,
          avgRating: { $round: ['$avgRating', 2] },
          positiveRatio: {
            $cond: [{ $gt: ['$count', 0] }, { $round: [{ $divide: ['$posCount', '$count'] }, 3] }, 0],
          },
          negativeRatio: {
            $cond: [{ $gt: ['$count', 0] }, { $round: [{ $divide: ['$negCount', '$count'] }, 3] }, 0],
          },
      } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ];
    const data = await db.collection('reviews').aggregate(pipelineAgg).toArray();
    // Enrich each item with a human-readable product name
    const enriched = data.map((item) => ({
      ...item,
      productName: getProductName(item.asin),
    }));
    res.json(enriched);
  } catch (err) {
    console.error('/products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /products/:asin/stats
// ---------------------------------------------------------------------------
app.get('/products/:asin/stats', async (req, res) => {
  try {
    const reviews = await getReviewsForAsin(req.params.asin);
    if (reviews.length === 0) return res.status(404).json({ error: 'No reviews for this ASIN.' });
    res.json(summariseProduct(req.params.asin, reviews));
  } catch (err) {
    console.error('/products/:asin/stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /products/:asin/timeline
// ---------------------------------------------------------------------------
app.get('/products/:asin/timeline', async (req, res) => {
  const bucket = (req.query.bucket || 'month').toLowerCase();
  try {
    const reviews = await getReviewsForAsin(req.params.asin);
    const buckets = new Map();
    for (const r of reviews) {
      const d = reviewDate(r);
      if (!d) continue;
      let key;
      if (bucket === 'week') {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
      } else if (bucket === 'year') {
        key = `${d.getFullYear()}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      const b = buckets.get(key) || { count: 0, sumP: 0, sumR: 0, nR: 0, pos: 0, neu: 0, neg: 0 };
      const p = polarity(r);
      b.count++; b.sumP += p;
      if (typeof r.overall === 'number') { b.sumR += r.overall; b.nR++; }
      const lab = bucketLabel(p);
      if (lab === 'positive') b.pos++; else if (lab === 'negative') b.neg++; else b.neu++;
      buckets.set(key, b);
    }
    const out = [...buckets.entries()]
      .map(([period, v]) => ({
        period,
        count: v.count,
        avgPolarity: +(v.sumP / v.count).toFixed(3),
        avgRating: v.nR ? +(v.sumR / v.nR).toFixed(2) : null,
        positive: v.pos, neutral: v.neu, negative: v.neg,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
    res.json(out);
  } catch (err) {
    console.error('/timeline error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /products/:asin/themes
// ---------------------------------------------------------------------------
app.get('/products/:asin/themes', async (req, res) => {
  const type = (req.query.type || 'negative').toLowerCase();
  const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
  try {
    const reviews = await getReviewsForAsin(req.params.asin);
    const summary = summariseProduct(req.params.asin, reviews);

    const filtered = summary.topThemes
      .filter((t) => (type === 'positive' ? t.avgPolarity > 0.1 : t.avgPolarity < -0.1))
      .sort((a, b) => (type === 'positive' ? b.avgPolarity - a.avgPolarity : a.avgPolarity - b.avgPolarity))
      .slice(0, limit);

    const examples = new Map();
    for (const r of reviews) {
      const lab = r.cluster_label || 'Uncategorised';
      if (!filtered.find((t) => t.label === lab)) continue;
      if (examples.has(lab)) continue;
      examples.set(lab, { text: reviewText(r).slice(0, 280), polarity: polarity(r) });
    }
    res.json(filtered.map((t) => ({ ...t, example: examples.get(t.label) || null })));
  } catch (err) {
    console.error('/themes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /compare
// ---------------------------------------------------------------------------
app.get('/compare', async (req, res) => {
  const asinsRaw = (req.query.asins || '').toString();
  const asins = asinsRaw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);
  if (asins.length < 2) return res.status(400).json({ error: 'Provide 2-4 ASINs in ?asins=A,B[,C[,D]]' });
  try {
    const reviewsByAsin = await Promise.all(asins.map((a) => getReviewsForAsin(a)));
    const products = asins.map((a, i) => summariseProduct(a, reviewsByAsin[i]));
    res.json({ asins, products });
  } catch (err) {
    console.error('/compare error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /alerts
// ---------------------------------------------------------------------------
app.get('/alerts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  try {
    const cursor = db.collection('reviews').find(
      {},
      { projection: { asin: 1, sentiment_label: 1, sentiment_score: 1, overall: 1, unixReviewTime: 1, reviewTime: 1 } }
    );
    const map = new Map();
    for await (const r of cursor) {
      const d = reviewDate(r);
      if (!d) continue;
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const asin = r.asin || 'unknown';
      let inner = map.get(asin);
      if (!inner) { inner = new Map(); map.set(asin, inner); }
      const e = inner.get(period) || { count: 0, neg: 0 };
      e.count++;
      if (bucketLabel(polarity(r)) === 'negative') e.neg++;
      inner.set(period, e);
    }
    const alerts = [];
    for (const [asin, inner] of map.entries()) {
      const periods = [...inner.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      if (periods.length < 2) continue;
      const ratios = periods.map(([p, v]) => ({ period: p, count: v.count, neg: v.neg, ratio: v.count ? v.neg / v.count : 0 }));
      const last = ratios[ratios.length - 1];
      const baseline = ratios.slice(0, -1);
      if (baseline.length === 0 || last.count < 5) continue;
      const baseAvg = baseline.reduce((s, x) => s + x.ratio, 0) / baseline.length;
      const delta = last.ratio - baseAvg;
      if (delta >= 0.15 && last.ratio >= 0.30) {
        const productName = getProductName(asin);
        alerts.push({
          asin,
          productName,
          period: last.period,
          severity: delta >= 0.30 ? 'high' : 'medium',
          baselineNegativeRatio: +baseAvg.toFixed(3),
          currentNegativeRatio: +last.ratio.toFixed(3),
          delta: +delta.toFixed(3),
          reviewCount: last.count,
          message: `Negative-review share rose from ${(baseAvg * 100).toFixed(0)}% to ${(last.ratio * 100).toFixed(0)}% in ${last.period}.`,
        });
      }
    }
    alerts.sort((a, b) => b.delta - a.delta);
    res.json(alerts.slice(0, limit));
  } catch (err) {
    console.error('/alerts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /insights/:asin
// ---------------------------------------------------------------------------
function buildInsights(summary, positiveThemes, negativeThemes) {
  const sentimentLabel =
    summary.avgPolarity > 0.3 ? 'strongly positive' :
    summary.avgPolarity > 0.1 ? 'positive' :
    summary.avgPolarity > -0.1 ? 'mixed' :
    summary.avgPolarity > -0.3 ? 'negative' : 'strongly negative';

  const lines = [];
  const displayName = summary.productName && summary.productName !== summary.asin
    ? `${summary.productName} (${summary.asin})`
    : summary.asin;
  lines.push(`Customers' overall sentiment toward ${displayName} is ${sentimentLabel} (polarity ${summary.avgPolarity.toFixed(2)}, average rating ${summary.avgRating ?? 'n/a'}).`);
  lines.push(`Of ${summary.total} analysed reviews, ${summary.distribution.positive} were positive, ${summary.distribution.neutral} neutral, and ${summary.distribution.negative} negative.`);
  if (positiveThemes.length > 0) {
    const top = positiveThemes.slice(0, 3).map((t) => `${t.label} (${t.count} mentions)`).join(', ');
    lines.push(`What customers love: ${top}.`);
  }
  if (negativeThemes.length > 0) {
    const top = negativeThemes.slice(0, 3).map((t) => `${t.label} (${t.count} mentions)`).join(', ');
    lines.push(`Top complaints: ${top}.`);
  }

  const recs = [];
  if (negativeThemes.length > 0) {
    recs.push(`Prioritise fixes around "${negativeThemes[0].label}" - it accounts for ${negativeThemes[0].count} of the negative reviews and is dragging the polarity score down.`);
  }
  if (summary.distribution.negative / Math.max(1, summary.total) > 0.25) {
    recs.push('Negative-review share is over 25% - consider an outreach campaign to dissatisfied buyers and update the product listing to clarify expectations.');
  }
  if (positiveThemes.length > 0) {
    recs.push(`Lean into "${positiveThemes[0].label}" in marketing copy - it is the strongest praise theme.`);
  }
  if (summary.avgRating !== null && summary.avgRating < 4) {
    recs.push('Average rating is below 4.0 - every 0.1 increase typically lifts conversion meaningfully on Amazon. Address the top complaint first.');
  }
  return { headline: lines, recommendations: recs };
}

app.get('/insights/:asin', async (req, res) => {
  try {
    const reviews = await getReviewsForAsin(req.params.asin);
    if (reviews.length === 0) return res.status(404).json({ error: 'No reviews for this ASIN.' });
    const summary = summariseProduct(req.params.asin, reviews);
    const positiveThemes = summary.topThemes.filter((t) => t.avgPolarity > 0.1).sort((a, b) => b.avgPolarity - a.avgPolarity);
    const negativeThemes = summary.topThemes.filter((t) => t.avgPolarity < -0.1).sort((a, b) => a.avgPolarity - b.avgPolarity);
    const insights = buildInsights(summary, positiveThemes, negativeThemes);
    const sortedByPolarity = [...reviews].sort((a, b) => polarity(b) - polarity(a));
    const positiveQuotes = sortedByPolarity.slice(0, 3).map((r) => ({ text: reviewText(r).slice(0, 240), polarity: polarity(r) }));
    const negativeQuotes = sortedByPolarity.slice(-3).reverse().map((r) => ({ text: reviewText(r).slice(0, 240), polarity: polarity(r) }));
    res.json({
      summary,
      positiveThemes: positiveThemes.slice(0, 5),
      negativeThemes: negativeThemes.slice(0, 5),
      positiveQuotes,
      negativeQuotes,
      insights,
    });
  } catch (err) {
    console.error('/insights error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NEW: /report/:asin?format=docx|md
// ---------------------------------------------------------------------------
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, size: opts.size, color: opts.color })],
    spacing: { after: 120 },
    alignment: opts.alignment,
  });
}
function h(text, level) {
  return new Paragraph({ heading: level, children: [new TextRun({ text })], spacing: { after: 200 } });
}
function tableRow(cells, headerStyle) {
  return new TableRow({
    children: cells.map((c) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(c), bold: !!headerStyle })] })],
        width: { size: Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
      })
    ),
  });
}

async function buildDocxReport({ summary, positiveThemes, negativeThemes, positiveQuotes, negativeQuotes, insights }) {
  const children = [];
  const reportTitle = summary.productName && summary.productName !== summary.asin
    ? `Review Intelligence Report — ${summary.productName}`
    : `Review Intelligence Report — ${summary.asin}`;
  children.push(h(reportTitle, HeadingLevel.TITLE));
  children.push(p(`Generated ${new Date().toLocaleDateString()} - SRIS - Semantic Review Intelligence System`, { color: '888888' }));
  children.push(h('Executive Summary', HeadingLevel.HEADING_1));
  for (const line of insights.headline) children.push(p(line));

  children.push(h('Key Metrics', HeadingLevel.HEADING_1));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow(['Metric', 'Value'], true),
      tableRow(['Total reviews', summary.total]),
      tableRow(['Average rating', summary.avgRating ?? 'n/a']),
      tableRow(['Average polarity', summary.avgPolarity.toFixed(3)]),
      tableRow(['Positive reviews', summary.distribution.positive]),
      tableRow(['Neutral reviews', summary.distribution.neutral]),
      tableRow(['Negative reviews', summary.distribution.negative]),
    ],
  }));

  if (positiveThemes.length) {
    children.push(h('What customers love', HeadingLevel.HEADING_1));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tableRow(['Theme', 'Mentions', 'Avg polarity'], true),
        ...positiveThemes.slice(0, 5).map((t) => tableRow([t.label, t.count, t.avgPolarity.toFixed(2)])),
      ],
    }));
    if (positiveQuotes.length) {
      children.push(h('Representative positive quotes', HeadingLevel.HEADING_2));
      for (const q of positiveQuotes) children.push(p(`"${q.text}"`));
    }
  }

  if (negativeThemes.length) {
    children.push(h('Top complaints', HeadingLevel.HEADING_1));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tableRow(['Theme', 'Mentions', 'Avg polarity'], true),
        ...negativeThemes.slice(0, 5).map((t) => tableRow([t.label, t.count, t.avgPolarity.toFixed(2)])),
      ],
    }));
    if (negativeQuotes.length) {
      children.push(h('Representative negative quotes', HeadingLevel.HEADING_2));
      for (const q of negativeQuotes) children.push(p(`"${q.text}"`));
    }
  }

  children.push(h('Recommendations', HeadingLevel.HEADING_1));
  for (const rec of insights.recommendations) children.push(p(`* ${rec}`));
  children.push(p(' '));
  children.push(p('Generated by SRIS - Semantic Review Intelligence System', { color: '888888', alignment: AlignmentType.CENTER }));

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

function buildMarkdownReport({ summary, positiveThemes, negativeThemes, positiveQuotes, negativeQuotes, insights }) {
  const mdTitle = summary.productName && summary.productName !== summary.asin
    ? `${summary.productName} (${summary.asin})`
    : summary.asin;
  let md = `# Review Intelligence Report — ${mdTitle}\n\n`;
  md += `_Generated ${new Date().toLocaleDateString()} - SRIS_\n\n`;
  md += `## Executive Summary\n\n`;
  for (const line of insights.headline) md += `- ${line}\n`;
  md += `\n## Key Metrics\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Total reviews | ${summary.total} |\n`;
  md += `| Average rating | ${summary.avgRating ?? 'n/a'} |\n`;
  md += `| Average polarity | ${summary.avgPolarity.toFixed(3)} |\n`;
  md += `| Positive | ${summary.distribution.positive} |\n`;
  md += `| Neutral | ${summary.distribution.neutral} |\n`;
  md += `| Negative | ${summary.distribution.negative} |\n\n`;
  if (positiveThemes.length) {
    md += `## What customers love\n\n`;
    for (const t of positiveThemes.slice(0, 5)) md += `- **${t.label}** - ${t.count} mentions (polarity ${t.avgPolarity.toFixed(2)})\n`;
    md += `\n`;
    if (positiveQuotes.length) {
      md += `### Sample positive quotes\n\n`;
      for (const q of positiveQuotes) md += `> ${q.text}\n\n`;
    }
  }
  if (negativeThemes.length) {
    md += `## Top complaints\n\n`;
    for (const t of negativeThemes.slice(0, 5)) md += `- **${t.label}** - ${t.count} mentions (polarity ${t.avgPolarity.toFixed(2)})\n`;
    md += `\n`;
    if (negativeQuotes.length) {
      md += `### Sample negative quotes\n\n`;
      for (const q of negativeQuotes) md += `> ${q.text}\n\n`;
    }
  }
  md += `## Recommendations\n\n`;
  for (const rec of insights.recommendations) md += `- ${rec}\n`;
  return md;
}

app.get('/report/:asin', async (req, res) => {
  const fmt = (req.query.format || 'docx').toLowerCase();
  try {
    const reviews = await getReviewsForAsin(req.params.asin);
    if (reviews.length === 0) return res.status(404).json({ error: 'No reviews for this ASIN.' });
    const summary = summariseProduct(req.params.asin, reviews);
    const positiveThemes = summary.topThemes.filter((t) => t.avgPolarity > 0.1).sort((a, b) => b.avgPolarity - a.avgPolarity);
    const negativeThemes = summary.topThemes.filter((t) => t.avgPolarity < -0.1).sort((a, b) => a.avgPolarity - b.avgPolarity);
    const sortedByPolarity = [...reviews].sort((a, b) => polarity(b) - polarity(a));
    const positiveQuotes = sortedByPolarity.slice(0, 3).map((r) => ({ text: reviewText(r).slice(0, 240), polarity: polarity(r) }));
    const negativeQuotes = sortedByPolarity.slice(-3).reverse().map((r) => ({ text: reviewText(r).slice(0, 240), polarity: polarity(r) }));
    const insights = buildInsights(summary, positiveThemes, negativeThemes);
    const payload = { summary, positiveThemes, negativeThemes, positiveQuotes, negativeQuotes, insights };

    if (fmt === 'md') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="SRIS-${summary.asin}.md"`);
      return res.send(buildMarkdownReport(payload));
    }
    const buffer = await buildDocxReport(payload);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="SRIS-${summary.asin}.docx"`);
    res.send(buffer);
  } catch (err) {
    console.error('/report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SRIS server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
