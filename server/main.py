from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
import auth
import onboarding

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Filla - Authentication & Onboarding API",
    version="0.1.0"
)

# ============ CORS CONFIGURATION ============
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ INCLUDE ROUTERS ============
app.include_router(auth.router)
app.include_router(onboarding.router)

# ============ HEALTH CHECK ============
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Filla API"}

@app.get("/")
async def root():
    return {
        "message": "Welcome to Filla API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
