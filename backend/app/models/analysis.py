from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class SavedChart(Base):
    __tablename__ = "saved_charts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=True) # Optional source binding
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    config = Column(JSON) # JSON: { chartType, xAxis, yAxis, etc. }
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="charts")
    data_source = relationship("DataSource")

class SavedInsight(Base):
    __tablename__ = "saved_insights"

    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"))
    type = Column(String) # e.g., kpi_driver, outlier
    message = Column(Text)
    confidence = Column(Integer) # scaled 0-100 or float 0-1
    details = Column(JSON) # { reasoning, action_item, related_filter, etc. }
    created_at = Column(DateTime, default=datetime.utcnow)

    data_source = relationship("DataSource")
