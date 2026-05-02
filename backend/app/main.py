from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import auth, registros, alertas, admin
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 Legal Manager API starting...")
    print(f"📦 Connected to Supabase: {settings.SUPABASE_URL}")
    yield
    print("👋 Legal Manager API shutting down...")


app = FastAPI(
    title="Legal Manager API",
    description="SaaS para gestión de trámites legales y logísticos",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(registros.router, prefix="/api/v1/registros", tags=["registros"])
app.include_router(alertas.router, prefix="/api/v1/alertas", tags=["alertas"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "service": "legal-manager-api"}


@app.get("/")
def root():
    return {
        "message": "Legal Manager API",
        "docs": "/docs",
        "health": "/api/v1/health"
    }