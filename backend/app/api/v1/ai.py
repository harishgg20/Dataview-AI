
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core import database
from app.api import deps
from app.models.data_source import DataSource
from app.engine.loader import load_dataframe
from app.engine.ai_summarizer import DataSummarizer
import google.generativeai as genai
import os
import json

router = APIRouter()

class InsightRequest(BaseModel):
    source_id: int
    focus: str = "general"

@router.post("/generate")
def generate_insights(
    request: InsightRequest,
    db: Session = Depends(database.get_db),
    current_user = Depends(deps.get_current_user)
):
    # 1. Fetch Data Source
    data_source = db.query(DataSource).filter(DataSource.id == request.source_id).first()
    if not data_source:
        print(f"FAILED: Data source {request.source_id} not found")
        raise HTTPException(status_code=404, detail="Data source not found")
    
    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        print(f"FAILED: File not found at {file_path}")
        raise HTTPException(status_code=404, detail="File not found")

    # 2. Configure Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("FAILED: GEMINI_API_KEY not set")
        # Check fallback .env loading if needed, but os.getenv should work if loaded
        raise HTTPException(status_code=500, detail="Server misconfigured: Missing AI API Key")
    
    genai.configure(api_key=api_key)

    try:
        # 3. Load & Summarize Data
        # We load the full dataframe to get accurate stats
        df = load_dataframe(file_path, data_source.type, limit=None)
        
        # Determine sample size (row count)
        total_rows = len(df)
        
        # Generate statistical profile
        profile = DataSummarizer.generate_profile(df)
        
        # 4. Construct Prompt
        prompt = f"""
        You are an expert Senior Data Analyst. Analyze the following dataset statistical profile and generate 6 high-impact business insights.
        
        dataset_filename: "{data_source.connection_config.get('original_name')}"
        total_rows: {total_rows}
        
        DATA PROFILE:
        {json.dumps(profile, indent=2)}
        
        INSTRUCTIONS:
        1. Analyze 'skew', 'mean', 'max', and 'p75' to find PARETO distributions (Top Impact).
        2. Look for UNDERPERFORMING segments by comparing category means vs global mean.
        3. Identify DATA QUALITY issues by checking 'percent_missing' and 'unique_values'.
        4. Detect OUTLIERS using 'max' vs 'mean' + '3*std'.
        5. Calculate OPPORTUNITY SIZE if 'sum' is available (e.g., "Raising X to avg would add Y").
        
        REQUIRED INSIGHT TYPES (Generate a mix of 6):
        - 'pareto': "Top 20% of X contribute 80% of Y."
        - 'underperformer': "Segment X is performing 30% below average."
        - 'risk_alert': "Metric X is stable but Y is declining." (Use correlation/trend if available)
        - 'data_coverage': "Only 62% of records have valid X."
        - 'change_summary': "Average X increased by Y%." (Use min/max or distribution shifts or if date column usage suggests it)
        - 'benchmark': "High-performing X are 18% above average."
        - 'opportunity': "Improving X could unlock Y revenue." (Calculate estimated value)
        
        OUTPUT FORMAT (Strict JSON):
        {{
            "insights": [
                {{
                    "type": "pareto",
                    "message": "Top 20% of restaurants contribute 65% of total revenue.",
                    "confidence": 0.95,
                    "details": {{
                        "reasoning": "High positive skew (2.4) indicates revenue is concentrated.",
                        "sample_size": {total_rows},
                        "action_item": "Focus retention efforts on these top-tier performers.",
                        "related_filter": {{ "column": "Restaurant", "value": "TopTier" }}
                    }}
                }}
            ]
        }}
        """

        # 5. Call LLM
        # Switching to 'gemini-flash-latest' as user requested "simple model" to avoid 429s on 2.0
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        
        if not response.text:
            raise ValueError("Empty response from AI")

        # Clean markdown code blocks if present (just in case)
        text = response.text.replace("```json", "").replace("```", "").strip()
        
        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            # Fallback or simple repair could be added here
            print(f"Failed to parse JSON: {text}")
            raise ValueError("AI did not return valid JSON")
        
        for insight in result.get("insights", []):
            insight["isBookmarked"] = False
            
        return result

    except Exception as e:
        import traceback
        # Write to log file for debugging
        with open("error.log", "w") as f:
            f.write(str(e) + "\n")
            f.write(traceback.format_exc())
            
        print(f"AI Generation Error: {e}")
        traceback.print_exc()
        
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower() or "ResourceExhausted" in type(e).__name__:
            raise HTTPException(
                status_code=429, 
                detail="AI quota exceeded. Please wait 1 minute before retrying."
            )
            
        raise HTTPException(status_code=500, detail=f"AI generation failed: {error_msg}")

from app.models.analysis import SavedInsight
from typing import Dict, Any, List

class SaveInsightRequest(BaseModel):
    source_id: int
    type: str
    message: str
    confidence: float
    details: Dict[str, Any]

@router.post("/save")
def save_insight(
    request: SaveInsightRequest,
    db: Session = Depends(database.get_db),
    current_user = Depends(deps.get_current_user)
):
    try:
        saved_insight = SavedInsight(
            data_source_id=request.source_id,
            type=request.type,
            message=request.message,
            confidence=int(request.confidence * 100), # Store as 0-100 int
            details=request.details
        )
        db.add(saved_insight)
        db.commit()
        db.refresh(saved_insight)
        return {"message": "Insight saved successfully", "id": saved_insight.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save insight: {str(e)}")

@router.get("/saved/{source_id}")
def get_saved_insights(
    source_id: int,
    db: Session = Depends(database.get_db),
    current_user = Depends(deps.get_current_user)
):
    insights = db.query(SavedInsight).filter(SavedInsight.data_source_id == source_id).all()
    # Format for frontend
    return {
        "insights": [
            {
                "type": i.type,
                "message": i.message,
                "confidence": i.confidence / 100.0,
                "details": i.details,
                "isBookmarked": True, # They are saved, so they are bookmarked
                "id": i.id
            }
            for i in insights
        ]
    }

class AskDataRequest(BaseModel):
    source_id: int
    question: str

@router.post("/ask")
def ask_data(
    request: AskDataRequest,
    db: Session = Depends(database.get_db),
    current_user = Depends(deps.get_current_user)
):
    # 1. Fetch Data Source
    data_source = db.query(DataSource).filter(DataSource.id == request.source_id).first()
    if not data_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    file_path = data_source.connection_config.get('file_path')
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # 2. Configure Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)

    try:
        # 3. Load Data & Schema
        df = load_dataframe(file_path, data_source.type, limit=100) 
        columns = df.columns.tolist()
        dtypes = {k: str(v) for k, v in df.dtypes.items()}
        sample_data = df.head(3).to_dict(orient='records')

        # 4. Construct Prompt
        prompt = f"""
        You are an expert Data Analyst API. The user will ask a question about the dataset.
        You must analyze the schema and return a JSON response with a text answer AND a chart configuration to visualize it.

        DATASET SCHEMA:
        Columns: {columns}
        Data Types: {dtypes}
        Sample Data: {sample_data}

        USER QUESTION: "{request.question}"

        INSTRUCTIONS:
        1. Determine the best chart type to answer the question (bar, line, scatter, pie, area).
        2. Identify the X-axis (categorical/time) and Y-axis (numerical) columns.
        3. Determine the aggregation method (sum, avg, count, none).
        4. Provide a clear, concise text answer summarizing the insight or explaining what the chart shows.

        OUTPUT FORMAT (Strict JSON):
        {{
            "answer": "Sales have been increasing over the last 4 quarters, with Q4 being the highest.",
            "chart": {{
                "type": "bar",
                "xAxis": "Quarter",
                "yAxis": "Revenue",
                "agg": "sum",
                "title": "Quarterly Revenue"
            }}
        }}

        If the question cannot be visualized, set "chart" to null.
        """

        # 5. Call LLM
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        
        text = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        
        return result

    except Exception as e:
        print(f"Ask Data Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
