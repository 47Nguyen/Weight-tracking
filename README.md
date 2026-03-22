# Weight Tracker (full stack)

Personal weight logging with a target weight, JWT username/password auth, and a **scenario comparison** tool (gender, age, exercise level) that ranks rough metabolic “routes” using the Mifflin–St Jeor estimate plus activity factors — for insight only, not medical advice.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, SQLite (`backend/weight_tracker.db`), bcrypt passwords, JWT access tokens.
- **Frontend:** React + Vite + TypeScript (`frontend/`), proxied to the API in dev.

## Run locally

### API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Optional: set `SECRET_KEY` in `backend/.env` (see `app/config.py`).

### Web UI

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` to `http://127.0.0.1:8000`.

### Production build

```bash
cd frontend && npm run build
```

Serve `frontend/dist` with any static host and point API requests to your deployed FastAPI URL (update CORS in `backend/app/main.py` and the frontend `fetch` base URL as needed).