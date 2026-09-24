from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="TalentPrism AI",
    description="Evidence-Driven Candidate Intelligence, Talent Lens & Dynamic Ranking Platform",
    version="2.4.0"
)

# CORS middleware for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all endpoints under /api and root for universal Vercel compatibility
app.include_router(router, prefix="/api")
app.include_router(router)

@app.get("/")
def root():
    return {
        "platform": "TalentPrism AI",
        "tagline": "Stop Ranking Keywords. Start Understanding Talent.",
        "status": "online",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
