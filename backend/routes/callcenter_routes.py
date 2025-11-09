"""
Call Center Happiness Index API Routes
Analyzes customer service call data with CSAT scores and sentiment
"""

from fastapi import APIRouter, HTTPException
from pathlib import Path
import pandas as pd
import logging
from typing import Dict, Any, List
import glob

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

router = APIRouter()

# Path to scored call data
CALL_DATA_DIR = Path(__file__).parent.parent.parent / "testingfeat" / "out"

def load_all_call_data() -> pd.DataFrame:
    """Load and combine all scored call center CSV files"""
    csv_files = glob.glob(str(CALL_DATA_DIR / "*__scored.csv"))
    
    if not csv_files:
        logger.error(f"No scored CSV files found in {CALL_DATA_DIR}")
        raise FileNotFoundError("No call center data found")
    
    logger.info(f"Loading {len(csv_files)} CSV files")
    dfs = []
    for file in csv_files:
        df = pd.read_csv(file)
        dfs.append(df)
    
    combined = pd.concat(dfs, ignore_index=True)
    logger.info(f"Loaded {len(combined)} total calls")
    return combined

@router.get("/callcenter/overview")
async def get_happiness_overview() -> Dict[str, Any]:
    """
    Customer Happiness Overview - Top-level KPIs
    Provides executive-level view of customer experience health
    """
    try:
        df = load_all_call_data()
        
        # Calculate key metrics
        avg_csat = float(df['csat_1_5'].mean())
        sentiment_index = float(df['sentiment_score'].mean())
        
        # First-call resolution rate
        fcr_count = len(df[df['resolution'] == 'Resolved on first call'])
        fcr_rate = (fcr_count / len(df)) * 100
        
        # Average call duration in minutes
        avg_duration = float(df['total_seconds'].mean() / 60)
        
        # Top issue category
        top_category = df['category'].value_counts().index[0]
        top_category_count = int(df['category'].value_counts().iloc[0])
        
        # Call volume over time (group by category for trend)
        call_volume_by_category = df['category'].value_counts().to_dict()
        
        # Sentiment trend by category
        sentiment_by_category = df.groupby('category')['sentiment_score'].mean().to_dict()
        
        return {
            "kpis": {
                "avg_csat": round(avg_csat, 2),
                "sentiment_index": round(sentiment_index, 2),
                "fcr_rate": round(fcr_rate, 1),
                "avg_call_duration_minutes": round(avg_duration, 1),
                "top_issue_category": top_category,
                "top_issue_count": top_category_count,
                "total_calls": len(df)
            },
            "trends": {
                "call_volume_by_category": call_volume_by_category,
                "sentiment_by_category": {k: round(v, 2) for k, v in sentiment_by_category.items()}
            }
        }
    
    except Exception as e:
        logger.error(f"Error in happiness overview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callcenter/category-analysis")
async def get_category_analysis() -> Dict[str, Any]:
    """
    Category Deep Dive
    Analyzes performance across major issue categories
    """
    try:
        df = load_all_call_data()
        
        # Group by category
        category_stats = []
        
        for category in df['category'].unique():
            cat_df = df[df['category'] == category]
            
            # Calculate metrics
            avg_duration = float(cat_df['total_seconds'].mean())
            avg_csat = float(cat_df['csat_1_5'].mean())
            call_count = len(cat_df)
            
            # Sentiment distribution
            sentiment_dist = cat_df['sentiment_label'].value_counts().to_dict()
            sentiment_percentages = {
                k: round((v / len(cat_df)) * 100, 1) 
                for k, v in sentiment_dist.items()
            }
            
            # Identify insight flag
            insight_flag = None
            if call_count > df.groupby('category').size().mean() and avg_csat < 3:
                insight_flag = "high_volume_low_satisfaction"
            elif call_count < df.groupby('category').size().mean() * 0.5 and avg_duration > df['total_seconds'].mean():
                insight_flag = "low_volume_high_duration"
            elif avg_csat >= 4 and avg_duration > df['total_seconds'].mean():
                insight_flag = "high_satisfaction_high_duration"
            
            category_stats.append({
                "category": category,
                "avg_call_duration_seconds": round(avg_duration, 1),
                "avg_csat": round(avg_csat, 2),
                "call_count": call_count,
                "sentiment_distribution": sentiment_dist,
                "sentiment_percentages": sentiment_percentages,
                "insight_flag": insight_flag
            })
        
        # Sort by call count descending
        category_stats.sort(key=lambda x: x['call_count'], reverse=True)
        
        return {
            "categories": category_stats,
            "total_categories": len(category_stats)
        }
    
    except Exception as e:
        logger.error(f"Error in category analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callcenter/subcategory-analysis")
async def get_subcategory_analysis(category: str = None) -> Dict[str, Any]:
    """
    Subcategory Root-Cause Lens
    Drills down into specific subcategories within categories
    """
    try:
        df = load_all_call_data()
        
        # Filter by category if specified
        if category:
            df = df[df['category'] == category]
        
        # Group by subcategory
        subcategory_stats = []
        
        for subcategory in df['subcategory'].unique():
            sub_df = df[df['subcategory'] == subcategory]
            
            # Get parent category
            parent_category = sub_df['category'].iloc[0]
            
            # Calculate metrics
            avg_csat = float(sub_df['csat_1_5'].mean())
            avg_sentiment = float(sub_df['sentiment_score'].mean())
            avg_duration = float(sub_df['total_seconds'].mean() / 60)
            call_count = len(sub_df)
            
            # Sentiment bias
            sentiment_counts = sub_df['sentiment_label'].value_counts().to_dict()
            dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get)
            
            # First-call resolution
            fcr_count = len(sub_df[sub_df['resolution'] == 'Resolved on first call'])
            fcr_percentage = (fcr_count / len(sub_df)) * 100 if len(sub_df) > 0 else 0
            
            # Resolution breakdown
            resolution_breakdown = sub_df['resolution'].value_counts().to_dict()
            
            # Generate root cause hypothesis
            root_cause = None
            recommended_action = None
            
            if avg_csat < 2.5 and fcr_percentage < 50:
                root_cause = "Low satisfaction with poor first-call resolution suggests agent training gaps or systemic issues"
                recommended_action = "Implement targeted training program and review escalation processes"
            elif avg_duration > df['total_seconds'].mean() / 60 and avg_csat < 3:
                root_cause = "Long call durations with low satisfaction indicate unclear processes or complex workflows"
                recommended_action = "Simplify workflows and create step-by-step agent scripts"
            elif dominant_sentiment == 'negative':
                root_cause = "Predominantly negative sentiment indicates customer frustration with this issue type"
                recommended_action = "Prioritize UX improvements and proactive communication"
            
            subcategory_stats.append({
                "subcategory": subcategory,
                "category": parent_category,
                "avg_csat": round(avg_csat, 2),
                "avg_sentiment_score": round(avg_sentiment, 2),
                "avg_call_duration_minutes": round(avg_duration, 1),
                "call_count": call_count,
                "sentiment_bias": dominant_sentiment,
                "sentiment_counts": sentiment_counts,
                "fcr_percentage": round(fcr_percentage, 1),
                "resolution_breakdown": resolution_breakdown,
                "root_cause_hypothesis": root_cause,
                "recommended_action": recommended_action
            })
        
        # Sort by CSAT (lowest first to highlight problems)
        subcategory_stats.sort(key=lambda x: x['avg_csat'])
        
        return {
            "subcategories": subcategory_stats,
            "total_subcategories": len(subcategory_stats),
            "filtered_by_category": category
        }
    
    except Exception as e:
        logger.error(f"Error in subcategory analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callcenter/heatmap")
async def get_subcategory_heatmap() -> Dict[str, Any]:
    """
    Get heatmap data for subcategory CSAT scores
    Returns data formatted for heatmap visualization
    """
    try:
        df = load_all_call_data()
        
        # Create heatmap data: categories x subcategories
        heatmap_data = []
        
        for category in df['category'].unique():
            cat_df = df[df['category'] == category]
            subcategories = cat_df['subcategory'].unique()
            
            for subcategory in subcategories:
                sub_df = cat_df[cat_df['subcategory'] == subcategory]
                avg_csat = float(sub_df['csat_1_5'].mean())
                call_count = len(sub_df)
                
                heatmap_data.append({
                    "category": category,
                    "subcategory": subcategory,
                    "avg_csat": round(avg_csat, 2),
                    "call_count": call_count
                })
        
        return {
            "heatmap": heatmap_data,
            "categories": df['category'].unique().tolist(),
            "min_csat": float(df.groupby('subcategory')['csat_1_5'].mean().min()),
            "max_csat": float(df.groupby('subcategory')['csat_1_5'].mean().max())
        }
    
    except Exception as e:
        logger.error(f"Error generating heatmap: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

