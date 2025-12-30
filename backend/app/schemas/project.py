from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    status: Optional[str] = None

class ProjectOut(ProjectBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
