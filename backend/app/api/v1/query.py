from fastapi import APIRouter, Depends, HTTPException
from app.engine.query_router import run_query
from app.core import database, security
# Add auth dependency

router = APIRouter()

@router.post("/run")
def run_query_api(payload: dict):
    try:
        # In a real app, validate payload with Pydantic
        result = run_query(payload)
        return {"data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
