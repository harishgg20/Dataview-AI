
import sys
import os

# Ensure app is in python path
sys.path.append(os.getcwd())

try:
    from app.core.database import Base
    # Import all models
    from app.models.user import User
    from app.models.project import Project
    from app.models.analysis import SavedChart
    from app.models.data_source import DataSource
    # Skipping dashboard if not used, but safer to import if it links to things
    from app.models.dashboard import Dashboard 
    
    from sqlalchemy.orm import configure_mappers
    configure_mappers()
    print("SUCCESS: Mappers configured correctly.")
except Exception as e:
    print(f"ERROR: {e}")
