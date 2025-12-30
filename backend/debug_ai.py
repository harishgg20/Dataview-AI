
import requests
import json

BASE_URL = "http://127.0.0.1:8002/api/v1"

def debug():
    # 1. Get Sources
    print("Fetching sources...")
    try:
        r = requests.get(f"{BASE_URL}/data-sources/")
        sources = r.json()
        print(f"Found {len(sources)} sources.")
        if not sources:
            print("No sources found.")
            return

        source_id = sources[0]['id']
        print(f"Testing with Source ID: {source_id}")

        # 2. Call Generate
        payload = {"source_id": source_id, "focus": "general"}
        print(f"Sending payload: {payload}")
        
        r = requests.post(f"{BASE_URL}/ai/generate", json=payload)
        print(f"Status Code: {r.status_code}")
        print("Response Body:")
        print(r.text)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug()
