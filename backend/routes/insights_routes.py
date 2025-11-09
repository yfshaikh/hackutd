"""
Insights API Routes - Churn Analysis & Issue Detection
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json
import os
import logging
from pathlib import Path
from typing import Dict, Any

# Import Pydantic models
import sys
sys.path.append(str(Path(__file__).parent.parent))
from models.insights_models import (
    InsightsResponse, 
    ChurnAnalysis, 
    SentimentAnalysis,
    IssueAnalysis,
    ActionableInsight,
    InsightsMetadata
)

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

router = APIRouter()

# Path to insights data (prefer zero-shot ML analysis)
ZEROSHOT_INSIGHTS_FILE = Path(__file__).parent.parent / "trustpilot_insights_zeroshot.json"
KEYWORD_INSIGHTS_FILE = Path(__file__).parent.parent / "trustpilot_insights.json"

def get_insights_file():
    """Get the most recent insights file (prefer zero-shot ML)"""
    if ZEROSHOT_INSIGHTS_FILE.exists():
        return ZEROSHOT_INSIGHTS_FILE
    elif KEYWORD_INSIGHTS_FILE.exists():
        return KEYWORD_INSIGHTS_FILE
    return None

def load_insights():
    """Load insights and transform to unified format"""
    insights_file = get_insights_file()
    if not insights_file:
        return None
    
    with open(insights_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # If it's zero-shot format, transform it
    if 'summary' in data and 'metrics' in data:
        # Zero-shot format
        return {
            "metadata": {
                "total_reviews": data['summary']['total_reviews_analyzed'],
                "analysis_method": data['summary']['analysis_method'],
                "timestamp": data['summary']['timestamp']
            },
            "churn_analysis": {
                "risk_score": data['metrics']['churn_risk_score'],
                "at_risk_customers": data['metrics']['at_risk_customers'],
                "risk_percentage": round((data['metrics']['at_risk_customers'] / data['summary']['total_reviews_analyzed']) * 100, 1) if data['summary']['total_reviews_analyzed'] > 0 else 0
            },
            "sentiment_analysis": {
                "average_rating": data['metrics']['average_rating'],
                "negative_percentage": data['metrics']['negative_reviews_percentage'],
                "rating_distribution": {}
            },
            "issue_analysis": {
                "top_issues": {issue['category']: issue['count'] for issue in data['top_issues']},
                "issue_percentages": {issue['category']: issue['percentage'] for issue in data['top_issues']}
            },
            "actionable_insights": data.get('actionable_insights', [])
        }
    else:
        # Keyword-based format (already in correct format)
        return data

INSIGHTS_FILE = get_insights_file()

@router.get("/insights", response_model=InsightsResponse)
async def get_insights() -> Dict[str, Any]:
    """
    Get AI insights for the dashboard (uses zero-shot ML when available)
    Returns data formatted for the frontend InsightsPage component
    
    Returns:
        InsightsResponse: Comprehensive insights including churn, sentiment, and issues
    """
    logger.info("📊 Fetching insights data")
    
    try:
        insights_file = get_insights_file()
        if not insights_file:
            logger.error("❌ No insights file found")
            raise HTTPException(
                status_code=404,
                detail="Insights data not found. Run the analysis first."
            )
        
        logger.info(f"📂 Loading insights from: {insights_file.name}")
        logger.info(f"📂 Full path: {insights_file}")
        logger.info(f"📂 Zero-shot file exists: {ZEROSHOT_INSIGHTS_FILE.exists()}")
        logger.info(f"📂 Keyword file exists: {KEYWORD_INSIGHTS_FILE.exists()}")
        
        with open(insights_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Transform zero-shot format to frontend-compatible structure
        if 'metrics' in data and 'top_issues' in data:
            logger.info("🤖 Processing zero-shot ML format")
            
            # Zero-shot format - transform to expected structure
            top_issues_dict = {issue['category']: issue['count'] for issue in data['top_issues']}
            issue_percentages = {issue['category']: issue['percentage'] for issue in data['top_issues']}
            
            logger.info(f"📋 Found {len(top_issues_dict)} issue categories")
            
            # Extract sentiment distribution from detailed_reviews
            rating_distribution = {}
            if 'detailed_reviews' in data:
                for review in data['detailed_reviews']:
                    rating = review.get('rating', 0)
                    rating_distribution[rating] = rating_distribution.get(rating, 0) + 1
                logger.info(f"⭐ Calculated rating distribution: {rating_distribution}")
            else:
                logger.warning("⚠️  No detailed_reviews found, using empty rating distribution")
            
            # Try to load churn signals from keyword-based file if available
            top_churn_signals = {}
            high_value_churners = 0
            keyword_data = None
            
            if KEYWORD_INSIGHTS_FILE.exists():
                logger.info(f"📊 Loading churn signals from keyword-based file: {KEYWORD_INSIGHTS_FILE}")
                try:
                    with open(KEYWORD_INSIGHTS_FILE, 'r', encoding='utf-8') as kf:
                        keyword_data = json.load(kf)
                        if 'churn_analysis' in keyword_data:
                            if 'top_churn_signals' in keyword_data['churn_analysis']:
                                top_churn_signals = keyword_data['churn_analysis']['top_churn_signals']
                                logger.info(f"✅ Loaded churn signals: {top_churn_signals}")
                            if 'high_value_churners' in keyword_data['churn_analysis']:
                                high_value_churners = keyword_data['churn_analysis']['high_value_churners']
                        else:
                            logger.warning("⚠️  No churn_analysis found in keyword file")
                except Exception as e:
                    logger.error(f"❌ Error loading churn signals from keyword file: {e}")
            else:
                logger.warning("⚠️  Keyword insights file not found, churn signals will be empty")
            
            response_data = {
                "churn_analysis": {
                    "risk_score": data['metrics']['churn_risk_score'],
                    "at_risk_customers": data['metrics']['at_risk_customers'],
                    "risk_percentage": round((data['metrics']['at_risk_customers'] / data['summary']['total_reviews_analyzed']) * 100, 1),
                    "top_churn_signals": top_churn_signals,
                    "high_value_churners": high_value_churners
                },
                "sentiment_analysis": {
                    "average_rating": data['metrics']['average_rating'],
                    "negative_percentage": data['metrics']['negative_reviews_percentage'],
                    "rating_distribution": rating_distribution
                },
                "issue_analysis": {
                    "top_issues": top_issues_dict,
                    "issue_percentages": issue_percentages,
                    "top_keywords": keyword_data.get('issue_analysis', {}).get('top_keywords', {}) if keyword_data else {}
                },
                "actionable_insights": data.get('actionable_insights', []),
                "metadata": {
                    "total_reviews": data['summary']['total_reviews_analyzed'],
                    "trustscore": data['metrics'].get('average_rating', 0),
                    "analysis_timestamp": data['summary'].get('timestamp', ''),
                    "analysis_method": data['summary'].get('analysis_method', 'zero-shot-classification')
                }
            }
            
            logger.info(f"✅ Successfully processed {response_data['metadata']['total_reviews']} reviews")
            logger.info(f"🎯 Churn Risk Score: {response_data['churn_analysis']['risk_score']}/100")
            logger.info(f"📊 Churn Signals Count: {len(response_data['churn_analysis']['top_churn_signals'])}")
            logger.info(f"📊 Churn Signals Data: {response_data['churn_analysis']['top_churn_signals']}")
            
            return response_data
        
        # Keyword format - already in correct structure
        logger.info("🔤 Processing keyword-based format")
        
        # Log the churn signals from keyword format
        if 'churn_analysis' in data and 'top_churn_signals' in data['churn_analysis']:
            logger.info(f"📊 Keyword format churn signals: {data['churn_analysis']['top_churn_signals']}")
        else:
            logger.warning("⚠️  No churn signals in keyword format!")
        
        logger.info(f"✅ Successfully loaded keyword-based insights")
        return data
    
    except FileNotFoundError as e:
        logger.error(f"❌ File not found: {e}")
        raise HTTPException(status_code=404, detail="Insights file not found")
    
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON parsing error: {e}")
        raise HTTPException(status_code=500, detail="Invalid JSON format in insights file")
    
    except KeyError as e:
        logger.error(f"❌ Missing key in data structure: {e}")
        raise HTTPException(status_code=500, detail=f"Invalid data structure: missing {e}")
    
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/insights/trustpilot")
async def get_trustpilot_insights():
    """
    Get Trustpilot analysis insights including churn risk and common issues
    Uses zero-shot ML analysis when available, falls back to keyword analysis
    """
    try:
        insights = load_insights()
        if not insights:
            raise HTTPException(
                status_code=404,
                detail="Insights data not found. Run the analysis (notebook or script) first."
            )
        
        return insights
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error parsing insights data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/trustpilot/churn")
async def get_churn_analysis():
    """
    Get detailed churn analysis
    """
    try:
        insights = load_insights()
        if not insights:
            raise HTTPException(status_code=404, detail="Insights data not found")
        
        return {
            "churn_analysis": insights.get("churn_analysis", {}),
            "metadata": insights.get("metadata", {})
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/trustpilot/issues")
async def get_issue_analysis():
    """
    Get detailed issue analysis
    """
    try:
        insights = load_insights()
        if not insights:
            raise HTTPException(status_code=404, detail="Insights data not found")
        
        return {
            "issue_analysis": insights.get("issue_analysis", {}),
            "sentiment_analysis": insights.get("sentiment_analysis", {}),
            "metadata": insights.get("metadata", {})
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/trustpilot/actionable")
async def get_actionable_insights():
    """
    Get prioritized actionable insights
    """
    try:
        insights = load_insights()
        if not insights:
            raise HTTPException(status_code=404, detail="Insights data not found")
        
        actionable = insights.get("actionable_insights", [])
        
        # Sort by priority
        actionable_sorted = sorted(actionable, key=lambda x: x.get('priority', 99))
        
        return {
            "insights": actionable_sorted,
            "total": len(actionable_sorted),
            "critical_count": sum(1 for i in actionable if i.get('severity') == 'critical')
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/summary")
async def get_insights_summary():
    """
    Get high-level summary across all platforms
    """
    try:
        # Load Trustpilot insights
        summary = {
            "trustpilot": {},
            "overall_sentiment": "negative",
            "total_data_points": 0
        }
        
        insights = load_insights()
        if insights:
            summary["trustpilot"] = {
                "churn_risk_score": insights["churn_analysis"]["risk_score"],
                "average_rating": insights["sentiment_analysis"]["average_rating"],
                "total_reviews": insights["metadata"]["total_reviews"],
                "at_risk_customers": insights["churn_analysis"]["at_risk_customers"]
            }
            summary["total_data_points"] += insights["metadata"]["total_reviews"]
        
        # TODO: Add Reddit and Twitter data when available
        
        return summary
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

