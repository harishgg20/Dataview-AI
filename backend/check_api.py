import requests
import sys

def check_url(url, description):
    try:
        print(f"Checking {description}: {url}...", end=" ")
        response = requests.get(url, timeout=2)
        print(f"Status: {response.status_code}")
        return response.status_code
    except Exception as e:
        print(f"Failed: {e}")
        return None

base = "http://127.0.0.1:8002"

# 1. Check Root
check_url(f"{base}/", "Root")

# 2. Check Users Endpoint (Expect 401 if auth required, or 200 if not)
# Note: My implementation had Depends(get_current_active_user) so it MUST return 401 without token. 
# A 404 would mean it doesn't exist.
check_url(f"{base}/api/v1/users/", "Users Endpoint")

# 3. Check Data Sources
check_url(f"{base}/api/v1/data-sources/", "Data Sources Endpoint")
