from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from app.api.v1 import auth, projects, query, data_sources, ai, analysis, monitoring, users, dashboards

app = FastAPI(title="Analytics Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(data_sources.router, prefix="/api/v1/data-sources", tags=["Data Sources"])
app.include_router(query.router, prefix="/api/v1/query", tags=["Query Engine"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI Insights"])
app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["Monitoring"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(dashboards.router, prefix="/api/v1/dashboards", tags=["Dashboards"])

@app.get("/")
def read_root():
    return {"message": "Analytics Platform API is running"}
