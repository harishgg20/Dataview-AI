import pandas as pd
from app.engine.sql_executor import execute_sql

def sql_to_dataframe(query: str):
    data = execute_sql(query)
    return pd.DataFrame(data["rows"], columns=data["columns"])

def pandas_transform(df: pd.DataFrame, operations: dict):
    if "fillna" in operations:
        df = df.fillna(operations["fillna"])

    if operations.get("drop_duplicates"):
        df = df.drop_duplicates()

    if "groupby" in operations:
        gb = operations["groupby"]
        # Basic aggregation for now
        agg_dict = gb.get("agg", {})
        df = df.groupby(gb["by"]).agg(agg_dict).reset_index()

    return df
