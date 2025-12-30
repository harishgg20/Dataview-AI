import pandas as pd
import numpy as np
from app.core.memory_cache import df_cache

def load_dataframe(file_path: str, file_type: str, limit: int = None):
    # If file_type is 'postgres' or 'mysql', file_path might be a config dict or string
    # We expect callers to pass the dict if type is sql, or we parse the key.
    
    # Check Cache (only if no limit, or create cache key with limit?)
    cache_key = f"{str(file_path)}_{file_type}" # file_path can be dict
    cached_df = df_cache.get(cache_key)
    
    if cached_df is not None:
        if limit:
            return cached_df.head(limit)
        return cached_df

    try:
        df = None
        if file_type in ['postgres', 'mysql']:
            from sqlalchemy import create_engine
            # If passed as dict
            if isinstance(file_path, dict):
                config = file_path
                conn_str = config.get("connection_string")
                query = config.get("query", "SELECT * FROM public.tables LIMIT 100") # Default fallback
            else:
                # Fallback if string passed
                conn_str = file_path
                query = "SELECT 1" 
            
            if not conn_str:
                raise ValueError("Missing connection string")

            engine = create_engine(conn_str)
            # Use read_sql with context manager? pandas connection
            with engine.connect() as conn:
                df = pd.read_sql(query, conn)
                
        elif file_type == 'csv':
            try:
                # Read full file for analytics
                df = pd.read_csv(file_path, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding='latin1')
        elif file_type == 'excel':
            df = pd.read_excel(file_path)
        elif file_type == 'json':
            try:
                df = pd.read_json(file_path) 
            except ValueError:
                df = pd.read_json(file_path, lines=True)
        elif file_type == 'xml':
            df = pd.read_xml(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # Cache the result
        if df is not None:
            df_cache.set(cache_key, df)
            
        if limit:
            return df.head(limit)
        return df

    except Exception as e:
        raise ValueError(f"Failed to read data: {str(e)}")
