# Semantic Review Intelligence System (SRIS)

An end-to-end platform for analyzing Amazon product reviews using semantic search, topic clustering, sentiment scoring, anomaly detection, and seasonal forecasting.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite · Ant Design · Tailwind CSS · Framer Motion · React Router
- **Backend**: Node.js + Express · MongoDB Atlas · `@xenova/transformers` (all-MiniLM-L6-v2)
- **Analytics**: Python · HuggingFace Transformers · KMeans · VADER · Isolation Forest

---

## Project Structure

```
semantic-review-intelligence/
├── frontend/            # React frontend (Vite + TypeScript)
├── server/              # Node.js/Express API backend
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── backend/             # Legacy FastAPI backend (Python)
├── analytics/           # Python data pipeline scripts
├── dashboard/
│   └── archive/
│       └── streamlit_app.py   # Legacy Streamlit UI (archived)
├── requirements.txt
└── README.md
```

---

## Quick Start (Recommended)

Run the Node.js backend + React frontend together:

**Terminal 1 — Node.js server:**
```bash
cd server
cp .env.example .env          # then fill in your MONGO_URI
npm install
npm run dev                   # starts on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser. The Vite dev proxy automatically routes all `/api/*` requests to the Node.js server — no `.env` configuration needed for the frontend.

---

## Node.js Server Setup

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas cluster with an `amazon_reviews` database and an `embeddings` collection populated by the analytics pipeline

### Environment Variables

Copy `server/.env.example` to `server/.env` and fill in your values:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxxxx.mongodb.net/amazon_reviews?retryWrites=true&w=majority
DB_NAME=amazon_reviews
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> **Tip:** If you already have a root-level `.env` with `MONGO_URI` and `DB_NAME`, you don't need to create `server/.env` — the server automatically falls back to the repo root `.env`.

### Scripts

```bash
npm start    # production start
npm run dev  # development (auto-restarts on file change via --watch)
```

### API Endpoints

| Method | Path       | Description                              |
|--------|------------|------------------------------------------|
| GET    | `/`        | Health check                             |
| GET    | `/test-db` | List MongoDB collections                 |
| GET    | `/search`  | Semantic search (`?q=<query>&limit=<n>`) |

---

## Frontend Setup

### Install & Run (Development)

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**. No `.env` file needed — the Vite proxy handles API routing.

### Build for Production

```bash
cd frontend
npm run build
# Output is in frontend/dist/
```

### Environment Variables (Production only)

If deploying the frontend to a separate host, create `frontend/.env` and set the backend URL:

```env
VITE_API_BASE_URL=https://your-backend-host.com
```

---

## Pages

| Route     | Description                                      |
|-----------|--------------------------------------------------|
| `/`       | Landing page — Hero, Features, How It Works, Footer |
| `/search` | Semantic search interface                        |

---

## Analytics Pipeline (Python)

The `analytics/` scripts prepare the data that the server queries. Run them once after ingesting reviews:

```bash
pip install -r requirements.txt
export MONGO_URI="mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/"
export DB_NAME="amazon_reviews"

python -m analytics.preprocess    # clean & normalise review text
python -m analytics.embeddings    # generate + store vector embeddings
python -m analytics.sentiment     # sentiment scoring
python -m analytics.clustering    # KMeans topic clustering
```

---

## Legacy FastAPI Backend (Python)

The original FastAPI backend is preserved in `backend/`. To run it:

```bash
pip install -r requirements.txt
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

---

## Legacy Streamlit Dashboard

The original Streamlit dashboard has been archived to `dashboard/archive/streamlit_app.py`. To run it for reference:

```bash
pip install streamlit altair pymongo python-dotenv
streamlit run dashboard/archive/streamlit_app.py
```

---

## Dataset

[Amazon Reviews 2023](https://amazon-reviews-2023.github.io/) — stored in MongoDB Atlas.
