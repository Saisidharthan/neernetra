from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base
from app.api.v1 import auth, citizens, asha, district, gov_analytics, ai_chatbot, reports, simulation, ews
from app.engine.service import service as ews_service
from seed_data import seed_database

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    try:
        seed_database()
    except Exception as e:
        print(f"Startup DB seed check completed: {e}")

@app.on_event("startup")
def start_ews_engine():
    ews_service.start()

@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "authority": "Ministry of Development of North Eastern Region (MDoNER), Government of India",
        "docs_url": "/docs"
    }

# Register V1 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(citizens.router, prefix=settings.API_V1_STR)
app.include_router(asha.router, prefix=settings.API_V1_STR)
app.include_router(district.router, prefix=settings.API_V1_STR)
app.include_router(gov_analytics.router, prefix=settings.API_V1_STR)
app.include_router(ai_chatbot.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(ews.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
