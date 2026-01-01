
import requests

BASE_URL = "http://127.0.0.1:8000/api/v1/auth"

def test_auth():
    # 1. Signup
    email = "test_debug_500@example.com"
    password = "password123"
    print(f"Attempting signup for {email}...")
    
    try:
        r = requests.post(f"{BASE_URL}/signup", json={
            "email": email,
            "password": password,
            "first_name": "Test",
            "last_name": "User"
        })
        print(f"Signup Status: {r.status_code}")
        print(f"Signup Response: {r.text}")
    except Exception as e:
        print(f"Signup Request Failed: {e}")

    # 2. Login
    print(f"\nAttempting login for {email}...")
    try:
        # FastAPI OAuth2PasswordRequestForm expects form data, not JSON!
        # Wait, the frontend code in Step 2533 used JSON: api.post("/auth/login", { ... })
        # Let's check backend auth.py again.
        # Line 31: def login(user_credentials: UserLogin, ...
        # UserLogin is a Pydantic model (JSON).
        # So JSON is correct.
        
        r = requests.post(f"{BASE_URL}/login", json={
            "email": email,
            "password": password
        })
        print(f"Login Status: {r.status_code}")
        print(f"Login Response: {r.text}")
        
    except Exception as e:
        print(f"Login Request Failed: {e}")

if __name__ == "__main__":
    test_auth()
