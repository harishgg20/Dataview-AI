from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.core import database
from app.models.data_source import DataSource
from app.models.analysis import SavedInsight
from app.models.project import Project
from sqlalchemy import text
import time
import os

router = APIRouter()

@router.get("/stats")
def get_monitoring_stats(dataset_id: int = None, db: Session = Depends(database.get_db), current_user = Depends(deps.get_current_user)):
    print(f"DEBUG: Executing get_monitoring_stats with dataset_id={dataset_id}")
    # 1. DB Health & Latency
    start_time = time.time()
    try:
        db.execute(text("SELECT 1"))
        db_latency = (time.time() - start_time) * 1000
        db_status = "Connected"
    except Exception:
        db_status = "Disconnected"
        db_latency = 0

    # 2. Counts
    total_datasets = db.query(DataSource).join(Project).filter(Project.owner_id == current_user.id).count()
    
    insight_query = db.query(SavedInsight).join(DataSource).join(Project).filter(Project.owner_id == current_user.id)
    if dataset_id:
        insight_query = insight_query.filter(SavedInsight.data_source_id == dataset_id)
        # If filtering, active datasets is just 1 (if valid)
        active_ds_count = 1
    else:
        active_ds_count = total_datasets
        
    total_insights = insight_query.count()

    # 3. Freshness (Latest Project Update)
    last_update = db.query(Project.updated_at).filter(Project.owner_id == current_user.id).order_by(Project.updated_at.desc()).first()
    last_ingestion_time = last_update[0] if last_update else None

    # 4. Insight Quality (Real aggregation)
    def count_conf(threshold_min, threshold_max=None):
        q = db.query(SavedInsight).join(DataSource).join(Project).filter(Project.owner_id == current_user.id)
        if dataset_id:
            q = q.filter(SavedInsight.data_source_id == dataset_id)
            
        if threshold_max:
            return q.filter(SavedInsight.confidence >= threshold_min, SavedInsight.confidence < threshold_max).count()
        return q.filter(SavedInsight.confidence >= threshold_min).count()
        
    def count_low_conf(threshold):
        q = db.query(SavedInsight).join(DataSource).join(Project).filter(Project.owner_id == current_user.id)
        if dataset_id:
            q = q.filter(SavedInsight.data_source_id == dataset_id)
        return q.filter(SavedInsight.confidence < threshold).count()

    high_conf = count_conf(0.9)
    med_conf = count_conf(0.5, 0.9)
    low_conf = count_low_conf(0.5)

    # 5. Dataset Health (Real + Mock)
    ds_query = db.query(DataSource).join(Project).filter(Project.owner_id == current_user.id)
    if dataset_id:
        ds_query = ds_query.filter(DataSource.id == dataset_id)
    
    datasets = ds_query.order_by(DataSource.id.desc()).limit(5).all()
    
    dataset_health = []
    real_alerts = []
    import random
    import json
    for ds in datasets:
        config = ds.connection_config
        if isinstance(config, str):
            try:
                config = json.loads(config)
            except:
                config = {}
        
        # Ensure config is a dict (it could be None or a list)
        if not isinstance(config, dict):
            config = {}

        # Real Health Check
        health_status = "healthy"
        quality_status = "healthy"
        freshness_status = "healthy"
        last_query_time = "Unknown" 

        file_path = config.get("file_path")
        if file_path and os.path.exists(file_path):
            try:
                # Check Freshness (File mod time)
                mtime = os.path.getmtime(file_path)
                hours_since_mod = (time.time() - mtime) / 3600
                if hours_since_mod < 24:
                    freshness_status = "healthy"
                    last_query_time = f"{int(hours_since_mod)}h ago"
                else:
                    freshness_status = "warning"
                    last_query_time = f"{int(hours_since_mod // 24)}d ago"

                # Check Quality (Load DF)
                from app.engine.loader import load_dataframe
                # Load small sample or full? Full cached is fast.
                df = load_dataframe(file_path, ds.type, limit=1000) 
                
                null_counts = df.isnull().sum().sum()
                total_cells = df.size
                dupes = df.duplicated().sum()
                
                if (null_counts / total_cells) > 0.1 or dupes > 0:
                    quality_status = "critical" if dupes > 0 else "warning"
                    if dupes > 0:
                         real_alerts.append({"message": f"Duplicates found in {config.get('original_name', ds.id)}", "severity": "medium"})
                    if (null_counts / total_cells) > 0.1:
                         real_alerts.append({"message": f"High missing data in {config.get('original_name', ds.id)}", "severity": "low"})
                    
            except Exception as e:
                quality_status = "critical"
                print(f"Health check failed for {ds.id}: {e}")
        else:
            freshness_status = "critical"

        dataset_health.append({
            "name": config.get("original_name", config.get("filename", f"Dataset {ds.id}")),
            "freshness": freshness_status,
            "quality": quality_status,
            "last_query": last_query_time
        })

    # 6. Activity Log with Status
    recent_insights_query = db.query(SavedInsight).join(DataSource).join(Project).filter(Project.owner_id == current_user.id)
    if dataset_id:
        recent_insights_query = recent_insights_query.filter(SavedInsight.data_source_id == dataset_id)
        
    recent_insights = recent_insights_query.order_by(SavedInsight.created_at.desc()).limit(5).all()
    
    activity_log = []
    statuses = ["acknowledged", "actioned", "in_review", "ignored"]
    for i, insight in enumerate(recent_insights):
        activity_log.append({
            "type": "insight",
            "message": f"Captured Insight: {insight.type.replace('_', ' ').title()}",
            "time": insight.created_at,
            "status": statuses[i % len(statuses)] # Mock status for demo
        })
        
    # Mocks that depend on filtering
    coverage_pct = 92
    missing_dates = 3
    if dataset_id:
        # Mock specific stats
        coverage_pct = random.choice([85, 98, 100])
        missing_dates = 0 if coverage_pct == 100 else random.randint(1, 5)

    return {
        "status": "Operational",
        "database": {
            "status": db_status,
            "latency_ms": round(db_latency, 2)
        },
        "usage": {
            "active_datasets": active_ds_count,
            "total_insights": total_insights
        },
        "freshness": {
            "last_ingestion": last_ingestion_time,
            "status": "On time" if last_ingestion_time else "No data",
            "expected_refresh": "Every 6h"
        },
        "performance": {
            "avg_query_time_ms": 180 if not dataset_id else random.randint(50, 250),
            "slowest_query_s": 2.4 if not dataset_id else random.uniform(0.5, 3.0),
            "cached_queries_pct": 72
        },
        "insight_quality": {
            "high": high_conf,
            "medium": med_conf,
            "low": low_conf
        },
        "data_coverage": {
            "pct": coverage_pct,
            "missing_dates": missing_dates,
            "affected_kpis": ["Revenue", "Orders"]
        },
        "schema_changes": [] if dataset_id else [
            {"type": "removal", "column": "discount", "detail": "Column removed"},
            {"type": "type_change", "column": "rating", "detail": "String → Float"},
            {"type": "addition", "column": "delivery_time", "detail": "New column detected"}
        ],
        "dataset_health": dataset_health,
        "data_quality_alerts": real_alerts,
        "activity": activity_log
    }
