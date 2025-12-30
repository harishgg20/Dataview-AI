from sqlalchemy import text
from app.core.database import engine

def execute_sql(query: str, params: dict = None):
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        columns = result.keys()
        rows = result.fetchall()

    return {
        "columns": list(columns),
        "rows": [list(row) for row in rows]
    }
