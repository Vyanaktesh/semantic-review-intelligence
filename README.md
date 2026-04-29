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

## Quick Start (one command)

```bash
# from project root, the very first time:
npm run install:all     # installs root + server + frontend deps
npm run test:db         # confirms your Atlas .env works

# then any time you want to develop:
npm run dev             # starts BOTH backend (3001) and frontend (5173)
```

Open **http://localhost:5173**. The Vite dev proxy routes `/api/*` → `http://localhost:3001`.

Open the project in **VS Code** (`File → Open Folder…`) and you'll get:

- One-click **Run** → "Debug SRIS server" launch config
- Command palette → **Tasks: Run Task** → "SRIS: Dev (server + frontend)"
- Recommended extensions auto-suggested (ESLint, Prettier, Tailwind, MongoDB, Python)

### Two-terminal mode (alternate)

If you prefer separate terminals:

```bash
# Terminal 1
cd server && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

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

### Scripts

```bash
npm start    # production start
npm run dev  # development (auto-restarts on file change via --watch)
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/test-db` | List MongoDB collections |
| GET | `/search?q=<query>&limit=<n>` | Semantic search |
| GET | `/overview` | Global stats for the dashboard |
| GET | `/products?limit=<n>` | Top products with quick stats |
| GET | `/products/:asin/stats` | Single-product summary |
| GET | `/products/:asin/timeline?bucket=month\|week\|year` | Sentiment over time |
| GET | `/products/:asin/themes?type=positive\|negative` | Top praises / complaints |
| GET | `/compare?asins=A,B[,C[,D]]` | Side-by-side comparison |
| GET | `/alerts` | Negative-spike anomalies |
| GET | `/insights/:asin` | Auto-generated narrative insights |
| GET | `/report/:asin?format=docx\|md` | Downloadable report |

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

| Route | Description |
|---|---|
| `/` | Landing page — Hero, features, pipeline overview |
| `/dashboard` | Global KPIs, sentiment distribution, top themes, top products |
| `/search` | Semantic search interface |
| `/compare` | Pick 2–4 ASINs and benchmark them side-by-side |
| `/insights` & `/insights/:asin` | Auto-generated executive insights with Word/Markdown report download |
| `/alerts` | Negative-review-spike anomalies with severity tags |

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
