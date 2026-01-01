
from sqlalchemy import create_engine, inspect
from app.core.database import SQLALCHEMY_DATABASE_URL

# Fix for potential windows path issues in connection string if needed
url = SQLALCHEMY_DATABASE_URL
if url.startswith("sqlite:///./"):
    url = "sqlite:///sql_app.db"

try:
    engine = create_engine(url)
    inspector = inspect(engine)
    columns = inspector.get_columns('users')
    print("Columns in 'users' table:")
    for column in columns:
        print(f"- {column['name']} ({column['type']})")

except Exception as e:
    print(f"Error inspecting schema: {e}")
