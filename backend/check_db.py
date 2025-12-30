import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

try:
    from app.core.database import SessionLocal, engine
    from app.models.user import User
    from sqlalchemy import text

    # Try to connect
    print("Attempting to connect to database...")
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Database connection successful")
    
    # Try to query Users
    print("Attempting to query User table...")
    db = SessionLocal()
    try:
        count = db.query(User).count()
        print(f"User table exists. Count: {count}")
        user = db.query(User).first()
        if user:
            print(f"Found user: {user.email}")
            print(f"Password hash: {user.password_hash}")
        else:
            print("No users found")
    except Exception as e:
        print(f"Error querying User table: {e}")
    finally:
        db.close()

except Exception as e:
    print(f"Database check failed: {e}")
