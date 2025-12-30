import urllib.request
import json
import socket

BASE_URL = "http://127.0.0.1:8000/api/v1"

def login():
    url = f"{BASE_URL}/auth/login"
    data = {"email": "test@example.com", "password": "password"}
    headers = {"Content-Type": "application/json"}
    
    print(f"Logging in to {url}...")
    req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 200:
                body = json.loads(response.read().decode())
                print("Login Sucessful!")
                return body["access_token"]
            else:
                print(f"Login Failed with {response.getcode()}")
                return None
    except Exception as e:
        print(f"Login Error: {e}")
        return None

def get_projects(token):
    url = f"{BASE_URL}/projects" # Assuming this is the endpoint
    print(f"\nAccessing Protected Route: {url}")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Projects Access Response: {response.getcode()}")
            print(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Protected Route verification FAILED: {e.code}")
        print(e.read().decode())
    except Exception as e:
        print(f"Access Error: {e}")

if __name__ == "__main__":
    # Create user first just in case? No, assume check_api.py user works
    # Actually wait, I need a valid user. "test@example.com" might not exist?
    # check_login_query.py found "97a52001@gmail.com". Use that?
    # Wait, check_api.py got 401 because of invalid password.
    # I need VALID credentials to get a token.
    # I don't know the password for "97a52001@gmail.com".
    # I should create a fresh user or force a known password.
    
    # Strategy: Temporarily create a user via DB script first.
    pass
