import duckdb
import pandas as pd

# No global duckdb_conn to avoid threading/state issues with concurrent users.

def execute_duckdb(df: pd.DataFrame, query: str):
    """
    Execute analytical SQL in DuckDB against a specific DataFrame.
    """
    # Create an ephemeral in-memory database for this query
    con = duckdb.connect(database=":memory:")
    
    # Register the DataFrame as 'df' (or generic name) so SQL can query it
    # We assume the query uses 'df' or we replace table name in query?
    # Usually users write "SELECT * FROM df" or similar.
    con.register('df', df)
    
    try:
        result = con.execute(query).fetchdf()
        return {
            "columns": list(result.columns),
            "rows": result.values.tolist()
        }
    except Exception as e:
        raise e
    finally:
        con.close()

