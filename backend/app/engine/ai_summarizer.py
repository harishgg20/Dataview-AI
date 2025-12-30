
import pandas as pd
import numpy as np

class DataSummarizer:
    @staticmethod
    def generate_profile(df: pd.DataFrame) -> dict:
        """
        Generates a lightweight statistical profile of the dataframe
        formatted for LLM context injection.
        """
        profile = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": []
        }

        for col in df.columns:
            # 1. Base Info
            dtype = str(df[col].dtype)
            missing = int(df[col].isnull().sum())
            unique = int(df[col].nunique())
            
            col_info = {
                "name": col,
                "type": dtype,
                "missing_count": missing,
                "percent_missing": round((missing / len(df)) * 100, 1),
                "unique_values": unique
            }

            # 2. Type-specific stats
            if pd.api.types.is_numeric_dtype(df[col]):
                desc = df[col].describe()
                try:
                    skew = float(df[col].skew())
                except:
                    skew = None
                
                col_info.update({
                    "mean": float(desc['mean']) if not pd.isna(desc['mean']) else None,
                    "min": float(desc['min']) if not pd.isna(desc['min']) else None,
                    "max": float(desc['max']) if not pd.isna(desc['max']) else None,
                    "std": float(desc['std']) if not pd.isna(desc['std']) else None,
                    "sum": float(df[col].sum()) if not pd.isna(df[col].sum()) else None,
                    "p25": float(desc['25%']) if not pd.isna(desc['25%']) else None,
                    "p50": float(desc['50%']) if not pd.isna(desc['50%']) else None,
                    "p75": float(desc['75%']) if not pd.isna(desc['75%']) else None,
                    "skew": skew
                })
            else:
                # Top frequent values for categorical
                top_vals = df[col].value_counts().head(5).to_dict()
                col_info["top_values"] = {str(k): int(v) for k, v in top_vals.items()}

            profile["columns"].append(col_info)

        return profile
