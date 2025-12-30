from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core import database
from app.models.data_source import DataSource
from app.models.project import Project
from app.api import deps
from app.models.user import User
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DataSourceUpdate(BaseModel):
    name: str

class ConnectRequest(BaseModel):
    project_id: int
    name: str
    type: str
    connection_string: str
    query: str = "SELECT * FROM public.users LIMIT 100" # Example default

@router.put("/{id}")
def update_data_source(
    id: int,
    data: DataSourceUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch data source
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Verify project ownership
    project = db.query(Project).filter(Project.id == data_source.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to update this data source")

    # Update connection config
    # Note: SQLAlchemy might not track mutation of JSON field automatically unless we reassign the whole dict
    new_config = dict(data_source.connection_config)
    new_config["original_name"] = data.name
    # Backwards compatibility key if we decide to shift
    new_config["filename"] = data.name 
    
    data_source.connection_config = new_config
    
    db.commit()
    db.refresh(data_source)
    
    return data_source

@router.post("/connect")
def connect_database(
    req: ConnectRequest,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Verify Project
    project = db.query(Project).filter(Project.id == req.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate Type
    if req.type not in ['postgres', 'mysql']:
        raise HTTPException(status_code=400, detail="Unsupported database type")

    # Test Connection
    from app.engine.loader import load_dataframe
    try:
        # Try to load 1 row to verify
        config = {"connection_string": req.connection_string, "query": req.query}
        df = load_dataframe(config, req.type, limit=1)
        if df is None:
             raise ValueError("No data returned")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")

    # Save
    new_source = DataSource(
        project_id=req.project_id,
        type=req.type,
        connection_config={
            "connection_string": req.connection_string,
            "query": req.query,
            "original_name": req.name
        }
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)
    return new_source

@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    project_id: int = Form(...),
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Verify project ownership
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    allowed_extensions = {'.csv', '.xlsx', '.xls', '.json', '.xml'}
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}")

    # Deterministic file type
    file_type = 'csv'
    if ext in ['.xlsx', '.xls']:
        file_type = 'excel'
    elif ext == '.json':
        file_type = 'json'
    elif ext == '.xml':
        file_type = 'xml'

    # Generate unique filename
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Save to DB
    new_source = DataSource(
        project_id=project_id,
        type=file_type,
        connection_config={"file_path": file_path, "original_name": file.filename}
    )
    db.add(new_source)
    db.commit()
    db.refresh(new_source)

    return {"message": "File uploaded successfully", "id": new_source.id, "filename": file.filename, "type": file_type}

from app.engine.loader import load_dataframe

@router.get("/")
def read_data_sources(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_admin_user),
    db: Session = Depends(database.get_db)
):
    return db.query(DataSource).offset(skip).limit(limit).all()

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_source(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch data source
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Verify project ownership or Admin role
    if current_user.role != "admin":
        project = db.query(Project).filter(Project.id == data_source.project_id, Project.owner_id == current_user.id).first()
        if not project:
            raise HTTPException(status_code=403, detail="Not authorized to delete this data source")

    # Delete physical file if it exists
    if data_source.type in ['csv', 'excel', 'json', 'xml']:
        file_path = data_source.connection_config.get('file_path')
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                # Log error but continue with DB deletion
                print(f"Error deleting file {file_path}: {e}")

    db.delete(data_source)
    db.commit()
    return None

@router.get("/{id}/preview")
def preview_data_source(
    id: int,
    limit: int = 5,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch data source
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Verify project ownership
    project = db.query(Project).filter(Project.id == data_source.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this data source")

    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    try:
        import pandas as pd
        import numpy as np
        import traceback
        
        print(f"DEBUG: Reading file at {file_path} type {data_source.type}")
        
        # Ensure type is valid for loader
        ftype = data_source.type.lower() if data_source.type else 'csv'
        
        # Load Data
        # We need TOTAL rows for the UI count, so we load all (MVP) or count efficiently.
        # Since we just switched rows endpoint to Pandas/None limit, let's do same here for consistency.
        full_df = load_dataframe(file_path, ftype, limit=None)
        
        total_rows = len(full_df)
        
        # Apply preview limit
        df = full_df.head(limit)
            
        # Get dtypes
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Clean data for JSON serialization
        df = df.replace([np.inf, -np.inf], None)
        df = df.where(pd.notnull(df), None)
        
        return {
            "filename": data_source.connection_config.get('original_name'),
            "columns": df.columns.tolist(),
            "dtypes": dtypes,
            "total_rows": total_rows, 
            "total_columns": len(df.columns),
            "data": df.to_dict(orient="records"),
            "preview_limit": len(df)
        }
    except Exception as e:
        print(f"Error reading source: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to read source: {str(e)}")

@router.get("/{id}/statistics")
def get_data_source_statistics(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch data source
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Verify project ownership
    project = db.query(Project).filter(Project.id == data_source.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this data source")

    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    try:
        import pandas as pd
        import numpy as np
        
        # Load full dataframe for stats
        df = load_dataframe(file_path, data_source.type, limit=None)
        
        # Calculate robust statistics
        stats = {}
        total_rows = len(df)
        
        for col in df.columns:
            col_type = str(df[col].dtype)
            is_numeric = pd.api.types.is_numeric_dtype(df[col])
            
            # Base stats for all columns
            col_stats = {
                "type": col_type,
                "count": int(df[col].count()),
                "missing": int(df[col].isnull().sum()),
                "distinct": int(df[col].nunique())
            }
            
            # Derived stats
            col_stats["missing_pct"] = round((col_stats["missing"] / total_rows) * 100, 2) if total_rows > 0 else 0
            col_stats["distinct_pct"] = round((col_stats["distinct"] / total_rows) * 100, 2) if total_rows > 0 else 0
            
            # Numeric specific stats
            if is_numeric:
                desc = df[col].describe()
                col_stats.update({
                    "mean": float(desc['mean']) if not pd.isna(desc['mean']) else None,
                    "std": float(desc['std']) if not pd.isna(desc['std']) else None,
                    "min": float(desc['min']) if not pd.isna(desc['min']) else None,
                    "25%": float(desc['25%']) if not pd.isna(desc['25%']) else None,
                    "50%": float(desc['50%']) if not pd.isna(desc['50%']) else None,
                    "median": float(desc['50%']) if not pd.isna(desc['50%']) else None,
                    "75%": float(desc['75%']) if not pd.isna(desc['75%']) else None,
                    "max": float(desc['max']) if not pd.isna(desc['max']) else None,
                    "zeros": int((df[col] == 0).sum()),
                    "skew": float(df[col].skew()) if not pd.isna(df[col].skew()) else None,
                    "kurtosis": float(df[col].kurt()) if not pd.isna(df[col].kurt()) else None,
                    "mode": float(df[col].mode()[0]) if not df[col].mode().empty else None
                })
                
                # Outlier Detection (IQR Method)
                try:
                    q1 = df[col].quantile(0.25)
                    q3 = df[col].quantile(0.75)
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    
                    outlier_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
                    outlier_indices = df.index[outlier_mask].tolist()
                    
                    col_stats["outliers"] = {
                        "count": len(outlier_indices),
                        "indices": outlier_indices[:500],  # Cap payload size
                        "lower_bound": float(lower_bound),
                        "upper_bound": float(upper_bound)
                    }
                except Exception as e:
                    print(f"Outlier calc error {col}: {e}")
                    col_stats["outliers"] = {"count": 0, "indices": []}
            else:
                # Categorical specific stats
                col_stats.update({
                    "mode": str(df[col].mode()[0]) if not df[col].mode().empty else None
                })
            # Distribution Data (Power BI Style)
            try:
                if is_numeric:
                    # Create Histogram data (10 bins)
                    data_clean = df[col].dropna()
                    if not data_clean.empty:
                        hist, bin_edges = np.histogram(data_clean, bins=10)
                        col_stats["distribution"] = {
                            "type": "histogram",
                            "data": [{"bin": f"{bin_edges[i]:.2f}-{bin_edges[i+1]:.2f}", "count": int(count)} for i, count in enumerate(hist)]
                        }
                else:
                    # Top values for distribution
                    top_items = df[col].value_counts().head(10).to_dict()
                    col_stats["distribution"] = {
                        "type": "top_values",
                        "data": [{"name": str(k), "count": int(v)} for k, v in top_items.items()]
                    }
            except Exception as e:
                print(f"Error generating distribution for {col}: {e}")
                col_stats["distribution"] = None
            
            stats[col] = col_stats

        # --- AUTO-GENERATED SUMMARY ---
        summary = []
        summary.append(f"Dataset contains {total_rows:,} rows and {len(df.columns)} columns.")
        
        # 1. Missing Value Checks
        high_missing = [col for col, data in stats.items() if data.get('missing_pct', 0) > 5]
        if high_missing:
            summary.append(f"⚠️ {len(high_missing)} columns have >5% missing values: {', '.join(high_missing[:3])}{'...' if len(high_missing)>3 else ''}.")
        
        # 2. Skewness Checks (Numeric)
        skewed_cols = []
        for col in df.select_dtypes(include=[np.number]).columns:
            try:
                skew = df[col].skew()
                if abs(skew) > 1:
                    skewed_cols.append(col)
            except: pass
        if skewed_cols:
            summary.append(f"📈 {len(skewed_cols)} numeric columns are highly skewed (skew > 1): {', '.join(skewed_cols[:3])}{'...' if len(skewed_cols)>3 else ''}.")

        # 3. Constant Columns
        constant_cols = [col for col, data in stats.items() if data.get('distinct') == 1]
        if constant_cols:
             summary.append(f"🛑 {len(constant_cols)} columns contain a single constant value: {', '.join(constant_cols[:3])}.")

        # 4. Duplicate Rows
        dupes = int(df.duplicated().sum())
        if dupes > 0:
            summary.append(f"👯 Dataset contains {dupes:,} duplicate rows ({round(dupes/total_rows*100, 1)}%).")

        return {
            "total_rows": total_rows,
            "duplicate_rows": dupes,
            "column_stats": stats,
            "summary": summary
        }

    except Exception as e:
        print(f"Error calculating stats: {e}")
        # traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"Failed to calculate statistics: {str(e)}")

@router.get("/{id}/correlation")
def get_data_source_correlation(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch data source
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Verify project ownership
    project = db.query(Project).filter(Project.id == data_source.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this data source")

    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    try:
        import pandas as pd
        import numpy as np
        
        # Load full dataframe
        df = load_dataframe(file_path, data_source.type, limit=None)
        
        # Select numeric columns only
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
             return {"columns": [], "matrix": []}

        # Calculate Correlation Matrix
        corr_matrix = numeric_df.corr(method='pearson').round(2)
        
        # Format for frontend (Heatmap)
        # We need a list of { x: col1, y: col2, value: 0.5 }
        data = []
        cols = corr_matrix.columns.tolist()
        
        for i, col_x in enumerate(cols):
            for j, col_y in enumerate(cols):
                data.append({
                    "x": col_x,
                    "y": col_y,
                    "value": corr_matrix.iloc[i, j]
                })

        return {
            "columns": cols,
            "matrix": data
        }

    except Exception as e:
        print(f"Error calculating correlation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate correlation: {str(e)}")

class CleaningOperation(BaseModel):
    type: str  # drop_na, fill_na, drop_duplicates, drop_col, rename_col, change_type
    params: dict

class CleaningRequest(BaseModel):
    operations: List[CleaningOperation]

@router.post("/{id}/clean")
def apply_data_cleaning(
    id: int,
    request: CleaningRequest,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Verify project ownership
    project = db.query(Project).filter(Project.id == data_source.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this data source")

    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    import pandas as pd
    try:
        df = load_dataframe(file_path, data_source.type, limit=None)
        
        for op in request.operations:
            if op.type == "drop_duplicates":
                df.drop_duplicates(inplace=True)
            
            elif op.type == "drop_na":
                cols = op.params.get("columns", [])
                if cols:
                    df.dropna(subset=cols, inplace=True)
                else:
                    df.dropna(inplace=True)
            
            elif op.type == "fill_na":
                cols = op.params.get("columns", [])
                value = op.params.get("value")
                method = op.params.get("method") # mean, median, mode, constant
                
                target_cols = cols if cols else df.columns
                
                for col in target_cols:
                    if col not in df.columns: continue
                    
                    fill_val = value
                    if method == "mean" and pd.api.types.is_numeric_dtype(df[col]):
                        fill_val = df[col].mean()
                    elif method == "median" and pd.api.types.is_numeric_dtype(df[col]):
                        fill_val = df[col].median()
                    elif method == "mode":
                        mode_res = df[col].mode()
                        if not mode_res.empty:
                            fill_val = mode_res[0]
                    
                    if fill_val is not None:
                        df[col] = df[col].fillna(fill_val)

            elif op.type == "drop_col":
                cols = op.params.get("columns", [])
                df.drop(columns=[c for c in cols if c in df.columns], inplace=True)
            
            elif op.type == "rename_col":
                rename_map = op.params.get("mapper", {})
                df.rename(columns=rename_map, inplace=True)

            elif op.type == "change_type":
                col = op.params.get("column")
                new_type = op.params.get("type") # int, float, str, date
                if col in df.columns:
                    try:
                        if new_type == "int":
                            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
                        elif new_type == "float":
                            df[col] = pd.to_numeric(df[col], errors='coerce')
                        elif new_type == "str":
                            df[col] = df[col].astype(str)
                        elif new_type == "date":
                            df[col] = pd.to_datetime(df[col], errors='coerce')
                    except Exception as e:
                        print(f"Failed to cast {col} to {new_type}: {e}")

        # Save back to file
        # Convert explicit int columns that might have become float due to NaNs back if needed
        # (Though we handled basic cases above)
        
        if file_path.endswith(".csv"):
            df.to_csv(file_path, index=False)
        elif file_path.endswith(".xlsx"):
            df.to_excel(file_path, index=False)
        # JSON/XML logic is trickier to edit over, sticking to CSV/Excel primary support for write-back or generic handler
        
        # Invalidate Cache
        from app.core.memory_cache import df_cache
        cache_key = f"{file_path}_{data_source.type}"
        df_cache.invalidate(cache_key)

        return {"status": "success", "message": f"Applied {len(request.operations)} operations"}

    except Exception as e:
        print(f"Cleaning error: {e}")
        raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")




class FilterItem(BaseModel):
    column: str
    operator: str  # eq, neq, gt, lt, gte, lte, contains, not_contains
    value: Any

class QueryRequest(BaseModel):
    filters: List[FilterItem] = []
    group_by: Optional[str] = None
    agg_column: Optional[str] = None
    agg_method: Optional[str] = None  # sum, avg, count, min, max
    limit: int = 5000
    sort_by: Optional[str] = None
    sort_direction: Optional[str] = "desc" # asc, desc

@router.post("/{id}/query")
def query_data_source(
    id: int,
    query: QueryRequest,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch data source
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Verify project ownership
    project = db.query(Project).filter(Project.id == data_source.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this data source")

    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    try:
        import pandas as pd
        import numpy as np
        
        # 1. Load Data
        df = load_dataframe(file_path, data_source.type, limit=None)
        
        # 2. Apply Filters
        if query.filters:
            for f in query.filters:
                if f.column not in df.columns:
                    # Try creating column if it looks like a calculation? No, just skip for now.
                    continue
                
                # Check for numeric conversion if operator is numeric
                is_numeric_op = f.operator in ['gt', 'lt', 'gte', 'lte']
                if is_numeric_op:
                    df[f.column] = pd.to_numeric(df[f.column], errors='coerce')
                    f.value = float(f.value)

                if f.operator == 'eq':
                    df = df[df[f.column] == f.value]
                elif f.operator == 'neq':
                    df = df[df[f.column] != f.value]
                elif f.operator == 'gt':
                    df = df[df[f.column] > f.value]
                elif f.operator == 'lt':
                    df = df[df[f.column] < f.value]
                elif f.operator == 'gte':
                    df = df[df[f.column] >= f.value]
                elif f.operator == 'lte':
                    df = df[df[f.column] <= f.value]
                elif f.operator == 'contains':
                    df = df[df[f.column].astype(str).str.contains(str(f.value), case=False, na=False)]
                elif f.operator == 'not_contains':
                    df = df[~df[f.column].astype(str).str.contains(str(f.value), case=False, na=False)]

        # 3. Aggregation
        result_df = df
        
        if query.group_by and query.agg_method:
            if query.group_by not in df.columns:
                 raise HTTPException(status_code=400, detail=f"Group column {query.group_by} not found")
            
            grouped = df.groupby(query.group_by)
            target_col = query.agg_column if query.agg_column else query.group_by
            
            if query.agg_method == 'count':
                result_df = grouped.size().reset_index(name='count')
                
            elif query.agg_method in ['sum', 'avg', 'min', 'max'] and target_col:
                if target_col not in df.columns and query.agg_method != 'count':
                     raise HTTPException(status_code=400, detail=f"Agg column {target_col} not found")
                
                # Ensure numeric
                if target_col in df.columns:
                    df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
                
                if query.agg_method == 'sum':
                    result_df = grouped[target_col].sum().reset_index()
                elif query.agg_method == 'avg':
                    result_df = grouped[target_col].mean().reset_index()
                elif query.agg_method == 'min':
                    result_df = grouped[target_col].min().reset_index()
                elif query.agg_method == 'max':
                    result_df = grouped[target_col].max().reset_index()
        
        # 4. Sorting
        if query.sort_by and query.sort_by in result_df.columns:
            ascending = query.sort_direction == 'asc'
            result_df = result_df.sort_values(by=query.sort_by, ascending=ascending)
        
        # 5. Limit
        # Sanitize NaNs
        result_df = result_df.replace([np.inf, -np.inf], None)
        result_df = result_df.where(pd.notnull(result_df), None)
        
        result_data = result_df.head(query.limit).to_dict(orient='records')

        return {
            "data": result_data,
            "total_rows_after_filter": len(df) if not query.group_by else len(result_data) 
        }

    except Exception as e:
        print(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


class SegmentFilter(BaseModel):
    name: str # e.g., "North Region"
    filters: List[FilterItem]

class ComparisonRequest(BaseModel):
    segment1: SegmentFilter
    segment2: SegmentFilter

@router.post("/{id}/compare-segments")
def compare_segments(
    id: int,
    request: ComparisonRequest,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch data source
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Verify project ownership
    project = db.query(Project).filter(Project.id == data_source.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to access this data source")

    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    try:
        import pandas as pd
        import numpy as np

        # 1. Load Data
        df = load_dataframe(file_path, data_source.type, limit=None)
        
        # Helper to filter DF
        def apply_filters(base_df, filters):
            temp_df = base_df.copy()
            for f in filters:
                if f.column not in temp_df.columns: continue
                # Basic Type Handling
                if f.operator in ['gt', 'lt', 'gte', 'lte']:
                    temp_df[f.column] = pd.to_numeric(temp_df[f.column], errors='coerce')
                    f.value = float(f.value)
                
                if f.operator == 'eq': temp_df = temp_df[temp_df[f.column] == f.value]
                elif f.operator == 'neq': temp_df = temp_df[temp_df[f.column] != f.value]
                elif f.operator == 'gt': temp_df = temp_df[temp_df[f.column] > f.value]
                elif f.operator == 'lt': temp_df = temp_df[temp_df[f.column] < f.value]
                elif f.operator == 'gte': temp_df = temp_df[temp_df[f.column] >= f.value]
                elif f.operator == 'lte': temp_df = temp_df[temp_df[f.column] <= f.value]
                elif f.operator == 'contains': temp_df = temp_df[temp_df[f.column].astype(str).str.contains(str(f.value), case=False, na=False)]
                elif f.operator == 'not_contains': temp_df = temp_df[~temp_df[f.column].astype(str).str.contains(str(f.value), case=False, na=False)]
            return temp_df

        # 2. Create Segments
        df1 = apply_filters(df, request.segment1.filters)
        df2 = apply_filters(df, request.segment2.filters)

        # 3. Calculate Stats
        stats = []
        
        # Row Counts
        stats.append({
            "metric": "Row Count",
            "seg1": len(df1),
            "seg2": len(df2),
            "diff_pct": round(((len(df2) - len(df1)) / len(df1)) * 100, 1) if len(df1) > 0 else None
        })

        # Numeric Averages
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            mean1 = df1[col].mean()
            mean2 = df2[col].mean()
            
            if pd.isna(mean1) or pd.isna(mean2): continue
            
            diff = mean2 - mean1
            diff_pct = (diff / mean1 * 100) if mean1 != 0 else None
            
            stats.append({
                "metric": f"{col} (Avg)",
                "seg1": float(round(mean1, 2)),
                "seg2": float(round(mean2, 2)),
                "diff": float(round(diff, 2)),
                "diff_pct": float(round(diff_pct, 1)) if diff_pct is not None else None
            })

        return {
            "segment1_name": request.segment1.name,
            "segment2_name": request.segment2.name,
            "comparison": stats
        }

    except Exception as e:
        print(f"Comparison failed: {e}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.get("/{id}/rows")
def get_data_rows(
    id: int,
    start: int = 0,
    end: int = 100,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Fetch data source
    data_source = db.query(DataSource).filter(DataSource.id == id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")

    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    print(f"DEBUG: Requesting rows from {file_path} (Start: {start}, End: {end})")

    try:
        # Fallback to Pandas for stability (DuckDB having Windows/Format issues)
        from app.engine.loader import load_dataframe
        import pandas as pd
        import numpy as np
        import traceback

        # Ensure type is valid for loader
        ftype = data_source.type.lower() if data_source.type else 'csv'
        
        # Load Data
        df = load_dataframe(file_path, ftype, limit=None) # Load all for now (optimize later if needed)
        total_rows = len(df)
        
        # Slicing
        # Ensure indices are within bounds
        safe_end = min(end, total_rows)
        safe_start = min(start, total_rows)
        
        if safe_start >= safe_end:
             rows = []
        else:
            sliced = df.iloc[safe_start:safe_end]
            
            # Sanitize for JSON (NaN -> null, Infinity -> null)
            sliced = sliced.replace([np.inf, -np.inf], None)
            sliced = sliced.where(pd.notnull(sliced), None)
            
            rows = sliced.to_dict(orient='records')

        return {
            "total_rows": total_rows,
            "rows": rows,
            "start": safe_start,
            "end": safe_start + len(rows)
        }
        
    except Exception as e:
        print(f"Rows fetch failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch rows: {str(e)}")
