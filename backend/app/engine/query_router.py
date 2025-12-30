from app.engine.sql_executor import execute_sql
from app.engine.pandas_executor import sql_to_dataframe, pandas_transform
from app.engine.duckdb_executor import execute_duckdb

def run_query(payload: dict):
    engine = payload.get("engine", "postgres")

    if engine == "postgres":
        return execute_sql(payload["sql"])

    if engine == "pandas":
        df = sql_to_dataframe(payload["sql"])
        df = pandas_transform(df, payload.get("operations", {}))
        return {
            "columns": list(df.columns),
            "rows": df.values.tolist()
        }

    if engine == "duckdb":
        df = None
        
        # Scenario A: Analyzing a File (CSV, Excel)
        if "file_path" in payload:
            from app.engine.loader import load_dataframe
            # Use defaults or passed args for type
            df = load_dataframe(payload["file_path"], payload.get("file_type", "csv"))
            
        # Scenario B: Analyzing a SQL Result
        elif "source_sql" in payload:
             df = sql_to_dataframe(payload["source_sql"])
             
        if df is None:
            raise ValueError("No data source provided for DuckDB engine (file_path or source_sql required)")

        return execute_duckdb(df, payload["sql"])
