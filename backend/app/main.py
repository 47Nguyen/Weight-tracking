from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import analysis, auth, profile, weights

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Weight Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(weights.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
