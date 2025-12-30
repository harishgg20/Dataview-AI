import sys
import os
from datetime import timedelta

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.core import security
    
    # Test 1: Hash and Verify
    print("Testing Password Hashing...")
    password = "testpassword"
    hashed = security.get_password_hash(password)
    print(f"Hash created: {hashed[:20]}...")
    
    is_valid = security.verify_password(password, hashed)
    print(f"Verification of correct password: {is_valid}")
    
    is_invalid = security.verify_password("wrong", hashed)
    print(f"Verification of wrong password: {is_invalid}")
    
    # Test 2: Token Creation
    print("\nTesting Token Creation...")
    token = security.create_access_token(data={"sub": "test@example.com"})
    print(f"Token created: {token[:20]}...")

    # Test 3: Token Creation with full payload
    print("\nTesting Token Creation with full payload...")
    token_full = security.create_access_token(
        data={"sub": "test@example.com", "id": 1, "role": "viewer"},
        expires_delta=timedelta(minutes=30)
    )
    print(f"Full Token created: {token_full[:20]}...")
    
    print("\nAuth checks passed successfully.")

except Exception as e:
    print(f"\nCRITICAL FAILURE: {e}")
    import traceback
    traceback.print_exc()
