from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core import database
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut
from app.api import deps

router = APIRouter()

@router.post("/", response_model=ProjectOut)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    new_project = Project(
        name=project.name,
        description=project.description,
        owner_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/", response_model=List[ProjectOut])
def read_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    projects = db.query(Project).filter(Project.owner_id == current_user.id).offset(skip).limit(limit).all()
    return projects

@router.get("/{id}", response_model=ProjectOut)
def read_project(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    project = db.query(Project).filter(Project.id == id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{id}")
def delete_project(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    project = db.query(Project).filter(Project.id == id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
