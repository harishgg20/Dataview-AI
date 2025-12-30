from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

from app.core import database
from app.api import deps
from app.models.analysis import SavedChart
from app.models.project import Project
from app.models.user import User

router = APIRouter()

# --- Schemas ---
class SavedChartCreate(BaseModel):
    name: str
    description: Optional[str] = None
    data_source_id: Optional[int] = None
    config: Any # Flexible JSON

class SavedChartOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    data_source_id: Optional[int] = None
    config: Any
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/projects/{project_id}/charts", response_model=SavedChartOut)
def create_saved_chart(
    project_id: int,
    chart_in: SavedChartCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Verify Project Access
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_chart = SavedChart(
        project_id=project_id,
        name=chart_in.name,
        description=chart_in.description,
        data_source_id=chart_in.data_source_id,
        config=chart_in.config
    )
    db.add(new_chart)
    db.commit()
    db.refresh(new_chart)
    return new_chart

@router.get("/projects/{project_id}/charts", response_model=List[SavedChartOut])
def get_project_charts(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Verify Project Access
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    charts = db.query(SavedChart).filter(SavedChart.project_id == project_id).order_by(SavedChart.created_at.desc()).all()
    return charts

@router.delete("/charts/{chart_id}")
def delete_saved_chart(
    chart_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    chart = db.query(SavedChart).filter(SavedChart.id == chart_id).first()
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
        
    # Check ownership via project
    project = db.query(Project).filter(Project.id == chart.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(chart)
    db.commit()
    return {"message": "Chart deleted"}
