from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai, data, external, play

app = FastAPI(title="Yuno920 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://yuno920.com",
        "https://www.yuno920.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(data.router, prefix="/api", tags=["App Data"])
app.include_router(external.router, prefix="/api/external", tags=["External"])
app.include_router(play.router, prefix="/api/play", tags=["Play"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
