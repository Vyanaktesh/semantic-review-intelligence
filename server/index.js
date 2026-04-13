import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { MongoClient } from 'mongodb';
import { pipeline, env } from '@xenova/transformers';

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

// Disable local model file checks so Xenova downloads from HuggingFace Hub
env.allowLocalModels = false;

// ---------------------------------------------------------------------------
// MongoDB
// ---------------------------------------------------------------------------
const mongoClient = new MongoClient(MONGO_URI);
let db;

async function connectMongo() {
  await mongoClient.connect();
  db = mongoClient.db(DB_NAME);
  console.log(`MongoDB connected — database: ${DB_NAME}`);
}

// ---------------------------------------------------------------------------
// Embedding model (lazy-loaded, singleton)
// ---------------------------------------------------------------------------
let _embedder = null;

async function getEmbedder() {
  if (!_embedder) {
    console.log('Loading sentence-transformer model…');
    _embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: true }
    );
    console.log('Model ready.');
  }
  return _embedder;
}

// ---------------------------------------------------------------------------
// Embeddings cache (lazy-loaded from MongoDB, held in memory)
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

  // Build a flat Float32Array matrix (rows × hiddenDim) for fast dot-product
  const dim = vectors.length > 0 ? vectors[0].length : 0;
  const matrix = new Float32Array(vectors.length * dim);
  for (let i = 0; i < vectors.length; i++) {
    matrix.set(vectors[i], i * dim);
  }

  _embeddingsCache = { reviewIds, matrix, dim, count: vectors.length };
  console.log(`Embeddings cache built: ${vectors.length} vectors (dim=${dim})`);
  return _embeddingsCache;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Embed a single string and return a normalised Float32Array. */
async function embed(text) {
  const embedder = await getEmbedder();
  // pooling:'mean' + normalize:true mirrors Python all-MiniLM-L6-v2 behaviour
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return new Float32Array(output.data);
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET'],
  })
);

// Rate-limit the search endpoint: max 30 requests per minute per IP
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** GET / — health check */
app.get('/', (_req, res) => {
  res.json({ message: 'SRIS backend is running' });
});

/** GET /test-db — list MongoDB collections */
app.get('/test-db', async (_req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    res.json({ collections: collections.map((c) => c.name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /search?q=<query>&limit=<n> — semantic search */
app.get('/search', searchLimiter, async (req, res) => {
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const cache = await getEmbeddingsCache();

    if (cache.count === 0) {
      return res.json([]);
    }

    // Encode the query (output is already L2-normalised via normalize:true)
    const queryVec = await embed(q);

    // Cosine similarities via dot-product (vectors are L2-normalised)
    const { reviewIds, matrix, dim, count } = cache;
    const scores = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      let dot = 0;
      const offset = i * dim;
      for (let d = 0; d < dim; d++) dot += matrix[offset + d] * queryVec[d];
      scores[i] = dot;
    }

    // Top-k indices (descending)
    const indices = Array.from({ length: count }, (_, i) => i);
    indices.sort((a, b) => scores[b] - scores[a]);
    const topIndices = indices.slice(0, limit);

    const topIds = topIndices.map((i) => reviewIds[i]);
    const topScoreMap = new Map(topIndices.map((i) => [String(reviewIds[i]), scores[i]]));

    // Fetch matching reviews from MongoDB
    const reviews = await db
      .collection('reviews')
      .find({ _id: { $in: topIds } })
      .toArray();

    const results = reviews
      .map((r) => ({
        _id: String(r._id),
        reviewText: r.reviewText || '',
        asin: r.asin || '',
        sentiment_score: r.sentiment_score ?? undefined,
        cluster_label: r.cluster_label ?? undefined,
        overall: r.overall ?? undefined,
        score: topScoreMap.get(String(r._id)) ?? 0,
      }))
      .sort((a, b) => b.score - a.score); // $in does not preserve order

    res.json(results);
  } catch (err) {
    console.error('/search error:', err);
    res.status(500).json({ error: 'Search failed: ' + err.message });
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
