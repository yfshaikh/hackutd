"""
Facebook Routes - HTTP API endpoints for T-Mobile sentiment analysis via Facebook

This module provides REST API endpoints for T-Mobile Customer Happiness Index via Facebook:
- Facebook outage detection from T-Mobile official pages and posts
- Positive sentiment analysis for customer happiness tracking
- Real-time social media monitoring from Facebook pages
- Sentiment categorization and engagement metrics

Key Features:
- T-Mobile official page monitoring (T-Mobile, T-Mobile Support, Metro, Sprint)
- Weighted sentiment analysis with engagement metrics (likes, comments, shares)
- Outage detection with confidence scoring
- Customer happiness metrics from Facebook interactions
- Error handling and data validation
"""

import os
import sys
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()


# Add the project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import our Facebook monitoring class
from facebook_monitor import FacebookSentimentMonitor

# Create router
facebook_router = APIRouter(prefix="/api/facebook", tags=["facebook"])

# Pydantic models for response structure
class FacebookOutageResponse(BaseModel):
    success: bool
    timestamp: str
    total_outage_posts: int
    outages: list

class FacebookHappinessResponse(BaseModel):
    success: bool
    timestamp: str
    total_positive_posts: int
    average_happiness_score: float
    happiness_posts: list

class FacebookCombinedResponse(BaseModel):
    success: bool
    timestamp: str
    outage_data: Dict[str, Any]
    happiness_data: Dict[str, Any]
    overall_sentiment: Dict[str, Any]
    engagement_summary: Dict[str, Any]

# Initialize Facebook monitor (will be created per request to avoid auth issues)
def get_facebook_monitor():
    """Create a new Facebook monitor instance"""
    try:
        return FacebookSentimentMonitor()
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Failed to initialize Facebook API client: {str(e)}. Please check your Facebook access token."
        )

@facebook_router.get("/outages", response_model=FacebookOutageResponse)
async def get_facebook_outages(
    limit: int = Query(default=25, ge=5, le=50, description="Number of posts to fetch per Facebook page")
):
    """
    Get T-Mobile outage reports from Facebook
    
    Monitors T-Mobile's official Facebook pages and posts for service outages,
    network issues, or connectivity problems. Returns posts with confidence
    scores and engagement metrics (likes, comments, shares).
    
    Args:
        limit: Number of posts to fetch per Facebook page (5-50)
    
    Returns:
        JSON response with outage posts, confidence scores, engagement data, and metadata
    """
    try:
        monitor = get_facebook_monitor()
        result = monitor.get_outages_api(limit_per_page=limit)
        
        if not result['success']:
            raise HTTPException(status_code=503, detail=result.get('error', 'Failed to fetch Facebook outage data'))
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Internal server error: {str(e)}',
                'timestamp': datetime.now().isoformat(),
                'total_outage_posts': 0,
                'outages': []
            }
        )

@facebook_router.get("/happiness", response_model=FacebookHappinessResponse)
async def get_facebook_happiness(
    limit: int = Query(default=25, ge=5, le=50, description="Number of posts to fetch per Facebook page")
):
    """
    Get T-Mobile positive sentiment data from Facebook for Customer Happiness Index
    
    Analyzes T-Mobile official page posts and user interactions for positive sentiment
    indicators including service quality, network speed, customer service satisfaction,
    and feature appreciation. Includes engagement metrics for weighted analysis.
    
    Args:
        limit: Number of posts to fetch per Facebook page (5-50)
    
    Returns:
        JSON response with happiness posts, scores, and engagement metrics
    """
    try:
        monitor = get_facebook_monitor()
        result = monitor.get_happiness_api(limit_per_page=limit)
        
        if not result['success']:
            raise HTTPException(status_code=503, detail=result.get('error', 'Failed to fetch Facebook happiness data'))
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Internal server error: {str(e)}',
                'timestamp': datetime.now().isoformat(),
                'total_positive_posts': 0,
                'average_happiness_score': 0,
                'happiness_posts': []
            }
        )

@facebook_router.get("/sentiment", response_model=FacebookCombinedResponse)
async def get_facebook_sentiment(
    limit: int = Query(default=25, ge=5, le=50, description="Number of posts to fetch per Facebook page")
):
    """
    Get comprehensive T-Mobile sentiment analysis from Facebook combining outages and happiness
    
    Provides complete T-Mobile customer sentiment analysis by monitoring official Facebook
    pages for both negative (outages, issues) and positive (satisfaction, praise) indicators.
    Includes engagement-weighted metrics and overall sentiment scoring.
    
    Args:
        limit: Number of posts to fetch per Facebook page (5-50)
    
    Returns:
        JSON response with both outage and happiness data plus overall sentiment and engagement metrics
    """
    try:
        monitor = get_facebook_monitor()
        
        # Get both outage and happiness data
        outage_result = monitor.get_outages_api(limit_per_page=limit)
        happiness_result = monitor.get_happiness_api(limit_per_page=limit)
        
        # Calculate overall sentiment metrics
        total_outages = outage_result.get('total_outage_posts', 0)
        total_positive = happiness_result.get('total_positive_posts', 0)
        avg_happiness = happiness_result.get('average_happiness_score', 0)
        
        # Calculate engagement metrics
        outage_engagement = 0
        positive_engagement = 0
        
        if outage_result.get('outages'):
            outage_engagement = sum(
                post.get('likes', 0) + post.get('comments', 0) + post.get('shares', 0)
                for post in outage_result['outages']
            )
        
        if happiness_result.get('happiness_posts'):
            positive_engagement = sum(
                post.get('likes', 0) + post.get('comments', 0) + post.get('shares', 0)
                for post in happiness_result['happiness_posts']
            )
        
        # Calculate overall sentiment score (0-1 scale) with engagement weighting
        if total_outages + total_positive > 0:
            positive_ratio = total_positive / (total_outages + total_positive)
            
            # Weight by engagement (more engaged posts are more impactful)
            total_engagement = outage_engagement + positive_engagement
            if total_engagement > 0:
                engagement_weighted_positive = positive_engagement / total_engagement
                overall_score = (positive_ratio * 0.4) + (avg_happiness * 0.3) + (engagement_weighted_positive * 0.3)
            else:
                overall_score = (positive_ratio * 0.7) + (avg_happiness * 0.3)
        else:
            overall_score = 0.5  # Neutral if no data
        
        # Determine sentiment classification
        if overall_score >= 0.75:
            sentiment_status = "Very Positive"
        elif overall_score >= 0.6:
            sentiment_status = "Positive"
        elif overall_score >= 0.4:
            sentiment_status = "Neutral"
        elif overall_score >= 0.25:
            sentiment_status = "Negative"
        else:
            sentiment_status = "Very Negative"
        
        overall_sentiment = {
            'overall_score': round(overall_score, 3),
            'sentiment_status': sentiment_status,
            'total_posts_analyzed': total_outages + total_positive,
            'positive_posts': total_positive,
            'negative_posts': total_outages,
            'positive_ratio': round(positive_ratio if total_outages + total_positive > 0 else 0, 3)
        }
        
        engagement_summary = {
            'total_engagement': outage_engagement + positive_engagement,
            'outage_engagement': outage_engagement,
            'positive_engagement': positive_engagement,
            'engagement_ratio': round(positive_engagement / (outage_engagement + positive_engagement) if outage_engagement + positive_engagement > 0 else 0, 3)
        }
        
        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'outage_data': outage_result,
            'happiness_data': happiness_result,
            'overall_sentiment': overall_sentiment,
            'engagement_summary': engagement_summary
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Internal server error: {str(e)}',
                'timestamp': datetime.now().isoformat(),
                'outage_data': {'success': False, 'outages': []},
                'happiness_data': {'success': False, 'happiness_posts': []},
                'overall_sentiment': {'overall_score': 0, 'sentiment_status': 'Error'},
                'engagement_summary': {'total_engagement': 0}
            }
        )

@facebook_router.get("/pages")
async def get_monitored_pages():
    """
    Get list of T-Mobile Facebook pages being monitored
    
    Returns information about the Facebook pages that are being monitored
    for T-Mobile sentiment analysis, including page names and basic statistics.
    
    Returns:
        JSON response with monitored pages and their information
    """
    try:
        monitor = get_facebook_monitor()
        
        pages_info = []
        for page_name, page_id in monitor.target_pages.items():
            try:
                page_info = monitor.get_page_info(page_id)
                if 'error' not in page_info:
                    pages_info.append({
                        'name': page_info.get('name', page_name),
                        'id': page_id,
                        'username': page_info.get('username', ''),
                        'fan_count': page_info.get('fan_count', 0),
                        'about': page_info.get('about', '')[:200] + '...' if page_info.get('about', '') else ''
                    })
                else:
                    pages_info.append({
                        'name': page_name,
                        'id': page_id,
                        'error': 'Could not access page information',
                        'status': 'inaccessible'
                    })
            except Exception as e:
                pages_info.append({
                    'name': page_name,
                    'id': page_id,
                    'error': str(e),
                    'status': 'error'
                })
        
        return JSONResponse(content={
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'monitored_pages': pages_info,
            'total_pages': len(pages_info)
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Internal server error: {str(e)}',
                'timestamp': datetime.now().isoformat(),
                'monitored_pages': [],
                'total_pages': 0
            }
        )

@facebook_router.get("/health")
async def facebook_health_check():
    """
    Health check endpoint for Facebook API functionality
    
    Verifies that Facebook access token is configured and accessible.
    Tests connection to T-Mobile's official Facebook page.
    Use this endpoint to test Facebook integration before making data requests.
    
    Returns:
        JSON response with health status and configuration info
    """
    try:
        monitor = get_facebook_monitor()
        
        # Test access to T-Mobile's main page
        tmobile_page_info = monitor.get_page_info('TMobile')
        
        if 'error' in tmobile_page_info:
            return JSONResponse(
                status_code=503,
                content={
                    'success': False,
                    'message': 'Facebook API is not accessible',
                    'error': str(tmobile_page_info.get('error', 'Unknown error')),
                    'timestamp': datetime.now().isoformat(),
                    'help': 'Please check your Facebook access token (FACEBOOK_ACCESS_TOKEN) and permissions'
                }
            )
        
        return JSONResponse(content={
            'success': True,
            'message': 'Facebook API is accessible',
            'timestamp': datetime.now().isoformat(),
            'target_pages': list(monitor.target_pages.keys()),
            'test_page_info': {
                'name': tmobile_page_info.get('name', 'T-Mobile'),
                'id': tmobile_page_info.get('id', 'TMobile'),
                'fan_count': tmobile_page_info.get('fan_count', 0)
            },
            'api_version': 'v18.0'
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                'success': False,
                'message': 'Facebook API is not accessible',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'help': 'Please check your Facebook access token and ensure your app has the required permissions'
            }
        )
