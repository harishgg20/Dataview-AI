
import sqlalchemy
from sqlalchemy import create_engine, inspect

# Direct connection to the local SQLite DB
DATABASE_URL = "sqlite:///./sql_app.db"

def check_schema():
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        if not inspector.has_table("users"):
            print("Table 'users' does NOT exist.")
            return

        columns = inspector.get_columns("users")
        col_names = [c["name"] for c in columns]
        print("Columns in 'users':")
        for name in col_names:
            print(f"- {name}")
        
        if "role" not in col_names:
            print("MISSING: 'role' column is missing!")
        else:
            print("OK: 'role' column exists.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
