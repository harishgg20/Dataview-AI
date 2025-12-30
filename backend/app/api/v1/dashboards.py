from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.core import database
from app.models.dashboard import Dashboard, Widget
from app.models.user import User
from app.api import deps
from datetime import datetime

router = APIRouter()

# Schemas
class WidgetBase(BaseModel):
    title: str
    type: str
    config: Dict[str, Any]
    layout: Optional[Dict[str, Any]] = None

class WidgetCreate(WidgetBase):
    pass

class WidgetOut(WidgetBase):
    id: int
    dashboard_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardBase(BaseModel):
    name: str
    description: Optional[str] = None

class DashboardCreate(DashboardBase):
    pass

class DashboardOut(DashboardBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    widgets: List[WidgetOut] = []

    class Config:
        from_attributes = True

# Endpoints

@router.get("/", response_model=List[DashboardOut])
def read_dashboards(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return db.query(Dashboard).filter(Dashboard.user_id == current_user.id).all()

@router.post("/", response_model=DashboardOut)
def create_dashboard(
    data: DashboardCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    db_obj = Dashboard(
        name=data.name,
        description=data.description,
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{id}", response_model=DashboardOut)
def read_dashboard(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == id, Dashboard.user_id == current_user.id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard

@router.post("/{id}/widgets", response_model=WidgetOut)
def create_widget(
    id: int,
    data: WidgetCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == id, Dashboard.user_id == current_user.id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    widget = Widget(
        dashboard_id=id,
        title=data.title,
        type=data.type,
        config=data.config,
        layout=data.layout
    )
    db.add(widget)
    db.commit()
    db.refresh(widget)
    return widget

@router.delete("/{id}/widgets/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_widget(
    id: int,
    widget_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == id, Dashboard.user_id == current_user.id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    widget = db.query(Widget).filter(Widget.id == widget_id, Widget.dashboard_id == id).first()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    db.delete(widget)
    db.commit()
    return None
