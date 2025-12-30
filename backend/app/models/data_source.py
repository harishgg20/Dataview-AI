from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    type = Column(String) # postgres, csv, etc
    connection_config = Column(JSON)
    refresh_schedule = Column(String, nullable=True)

    project = relationship("Project", backref="data_sources")
