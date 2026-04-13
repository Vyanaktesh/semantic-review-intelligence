# Semantic Review Intelligence System (SRIS)

An end-to-end platform for analyzing Amazon product reviews using semantic search, topic clustering, sentiment scoring, anomaly detection, and seasonal forecasting.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite · Ant Design · Tailwind CSS · Framer Motion · React Router
- **Backend**: FastAPI + MongoDB Atlas + Atlas Vector Search
- **Analytics**: Python · HuggingFace Transformers · KMeans · VADER · Isolation Forest

---

## Project Structure

```
semantic-review-intelligence/
├── frontend/            # React frontend (Vite + TypeScript)
├── backend/             # FastAPI backend
│   ├── app.py
│   └── utils/
│       └── db.py
├── analytics/           # Python data pipeline scripts
├── dashboard/
│   └── archive/
│       └── streamlit_app.py   # Legacy Streamlit UI (archived)
├── requirements.txt
└── README.md
```

---

## Frontend Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run (Development)

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

### Build for Production

```bash
cd frontend
npm run build
# Output is in frontend/dist/
```

### Preview Production Build

```bash
cd frontend
npm run preview
```

### Environment Variables

Copy `.env.example` to `.env` in the `frontend/` directory and set:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Backend Setup

### Prerequisites

- Python ≥ 3.10
- MongoDB Atlas cluster with `amazon_reviews` database

### Install & Run

```bash
pip install -r requirements.txt
# Set environment variables:
export MONGO_URI="mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/"
export DB_NAME="amazon_reviews"

# Start FastAPI
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### API Endpoints

| Method | Path        | Description                        |
|--------|-------------|------------------------------------|
| GET    | `/`         | Health check                       |
| GET    | `/test-db`  | List MongoDB collections           |
| GET    | `/search`   | Semantic search (`?q=<query>`)     |

---

## Running Frontend + Backend Together

**Terminal 1 — Backend:**
```bash
uvicorn backend.app:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Pages

| Route     | Description                                      |
|-----------|--------------------------------------------------|
| `/`       | Landing page — Hero, Features, How It Works, Footer |
| `/search` | Semantic search interface                        |

---

## Legacy Streamlit Dashboard

The original Streamlit dashboard has been archived to `dashboard/archive/streamlit_app.py`. It is no longer the primary UI. To run it for reference:

```bash
pip install streamlit altair pymongo python-dotenv
streamlit run dashboard/archive/streamlit_app.py
```

---

## Dataset

[Amazon Reviews 2023](https://amazon-reviews-2023.github.io/) — stored in MongoDB Atlas.
