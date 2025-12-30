from sqlalchemy import text
from app.core.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            # Postgres vs SQLite syntax
            # Postgres supports IF NOT EXISTS in newer versions, but standard SQL doesn't always.
            # We'll just try to add it.
            conn.execute(text("ALTER TABLE users ADD COLUMN api_key VARCHAR"))
            conn.commit()
            print("Successfully added api_key column.")
        except Exception as e:
            print(f"Migration result: {e}")
            # Likely "duplicate column name" if already exists

if __name__ == "__main__":
    migrate()
