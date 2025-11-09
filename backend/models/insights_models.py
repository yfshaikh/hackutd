"""
Pydantic models for Insights API
Provides type safety and validation
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime


class ChurnAnalysis(BaseModel):
    """Churn risk analysis"""
    risk_score: int = Field(..., ge=0, le=100, description="Churn risk score (0-100)")
    at_risk_customers: int = Field(..., ge=0, description="Number of at-risk customers")
    risk_percentage: float = Field(..., ge=0, le=100, description="Percentage of at-risk customers")
    top_churn_signals: Dict[str, int] = Field(default_factory=dict, description="Top churn indicators")


class SentimentAnalysis(BaseModel):
    """Sentiment analysis results"""
    average_rating: float = Field(..., ge=0, le=5, description="Average rating (0-5)")
    negative_percentage: float = Field(..., ge=0, le=100, description="Percentage of negative reviews")
    rating_distribution: Dict[int, int] = Field(default_factory=dict, description="Distribution by star rating")


class IssueAnalysis(BaseModel):
    """Issue categorization results"""
    top_issues: Dict[str, int] = Field(..., description="Top issues by category")
    issue_percentages: Dict[str, str] = Field(..., description="Issue percentages")


class ActionableInsight(BaseModel):
    """Actionable insight recommendation"""
    title: str = Field(..., description="Insight title")
    description: str = Field(..., description="Detailed description")
    action: str = Field(..., description="Recommended action")
    severity: str = Field(default="medium", description="Severity level")
    
    class Config:
        extra = "allow"  # Allow additional fields like priority, impact, etc.


class InsightsMetadata(BaseModel):
    """Metadata about the analysis"""
    total_reviews: int = Field(..., ge=0, description="Total reviews analyzed")
    analysis_method: str = Field(default="keyword-based", description="Analysis method used")
    timestamp: Optional[str] = Field(None, description="Analysis timestamp")


class InsightsResponse(BaseModel):
    """Complete insights response"""
    churn_analysis: ChurnAnalysis
    sentiment_analysis: SentimentAnalysis
    issue_analysis: IssueAnalysis
    actionable_insights: List[ActionableInsight]
    metadata: InsightsMetadata
    
    class Config:
        json_schema_extra = {
            "example": {
                "churn_analysis": {
                    "risk_score": 85,
                    "at_risk_customers": 342,
                    "risk_percentage": 68.4,
                    "top_churn_signals": {
                        "switching": 45,
                        "canceling": 32
                    }
                },
                "sentiment_analysis": {
                    "average_rating": 2.1,
                    "negative_percentage": 75.3,
                    "rating_distribution": {
                        "1": 150,
                        "2": 80,
                        "3": 50,
                        "4": 30,
                        "5": 20
                    }
                },
                "issue_analysis": {
                    "top_issues": {
                        "Customer Service": 200,
                        "Billing": 150
                    },
                    "issue_percentages": {
                        "Customer Service": "60.0%",
                        "Billing": "45.0%"
                    }
                },
                "actionable_insights": [
                    {
                        "title": "High Churn Risk",
                        "description": "342 customers at risk",
                        "action": "Implement retention campaign",
                        "severity": "critical"
                    }
                ],
                "metadata": {
                    "total_reviews": 500,
                    "analysis_method": "zero-shot-classification",
                    "timestamp": "2025-11-09T14:00:00"
                }
            }
        }

