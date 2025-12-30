import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.core.database import SessionLocal
    from app.models.user import User
    
    email_to_find = "harish@example.com" # Replace with valid email if known or just test
    
    # Try to query
    print("Attempting to query User by email...")
    db = SessionLocal()
    try:
        # First get ANY email
        first_user = db.query(User).first()
        if first_user:
            email_to_find = first_user.email
            print(f"Found existing user email: {email_to_find}")
        
        # Now run the exact filter query
        user = db.query(User).filter(User.email == email_to_find).first()
        if user:
            print(f"Login query successful. Found user: {user.email}")
            print(f"Password hash length: {len(user.password_hash)}")
            
            # Verify hash (using dummy password, expecting False but NO CRASH)
            try:
                from app.core import security
                print("Attempting to verify password hash...")
                is_valid = security.verify_password("dummy123", user.password_hash)
                print(f"Verification result (should be False): {is_valid}")
            except Exception as e:
                print(f"CRITICAL: Password verification CRASHED: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"Login query returned None for {email_to_find} (Expected behavior for non-existent user)")
            
    except Exception as e:
        print(f"CRITICAL: Query failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

except Exception as e:
    print(f"Setup failed: {e}")
