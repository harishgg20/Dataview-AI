
import sys
import os

# Ensure backend root is in path
sys.path.append(os.getcwd())

print("--- STARTUP TEST ---")
try:
    from app import main
    print("SUCCESS: Imported app.main")
except ImportError as e:
    print(f"IMPORT ERROR: {e}")
except Exception as e:
    print(f"GENERAL ERROR: {e}")
    import traceback
    traceback.print_exc()
