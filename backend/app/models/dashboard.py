from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="dashboards")
    widgets = relationship("Widget", back_populates="dashboard", cascade="all, delete-orphan")

class Widget(Base):
    __tablename__ = "widgets"

    id = Column(Integer, primary_key=True, index=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False) # 'chart', 'metric', 'text'
    config = Column(JSON, nullable=False) # Query params, chart type, etc.
    layout = Column(JSON, nullable=True) # x, y, w, h for grid
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    dashboard = relationship("Dashboard", back_populates="widgets")
