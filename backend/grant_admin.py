import sys
import os

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
# Import ALL models to ensure SQLAlchemy mappers are registered
from app.models.user import User  
from app.models.project import Project
from app.models.data_source import DataSource

def make_admin(email: str):
    db = SessionLocal()
    try:
        print(f"Searching for user: {email}")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found!")
            # Attempt to list all users to see if any exist
            all_users = db.query(User).all()
            print(f"Total users in DB: {len(all_users)}")
            for u in all_users:
                print(f" - {u.email} (Role: {u.role})")
            return
        
        print(f"User found: {user.email}. Current role: {user.role}")
        user.role = "admin"
        db.commit()
        db.refresh(user)
        print(f"Successfully promoted {email} to ADMIN. New role: {user.role}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    email = "harishgouda52001@gmail.com"
    make_admin(email)
