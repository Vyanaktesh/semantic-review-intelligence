/**
 * Quick MongoDB Atlas connection smoke test.
 * Usage: node test-connection.mjs
 *
 * Prints collection names, document counts, and a sample doc shape so you
 * can verify your .env MONGO_URI works before starting the full server.
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const c = new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
try {
  await c.connect();
  const db = c.db(process.env.DB_NAME || 'amazon_reviews');
  const cols = await db.listCollections().toArray();
  console.log('OK — connected. Collections:', cols.map(x => x.name).join(', '));
  for (const name of ['reviews', 'embeddings']) {
    if (!cols.find(x => x.name === name)) continue;
    const coll = db.collection(name);
    const n = await coll.estimatedDocumentCount();
    const sample = await coll.findOne({});
    console.log(`\n--- ${name} (count ~ ${n}) ---`);
    console.log('fields:', sample ? Object.keys(sample).join(', ') : '(empty)');
  }
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await c.close();
}
