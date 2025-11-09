"""
Twitter/X Routes - HTTP API endpoints for T-Mobile sentiment analysis via Twitter/X

This module provides REST API endpoints for T-Mobile Customer Happiness Index via Twitter:
- Twitter negative sentiment detection from user tweets
- Positive sentiment analysis for customer happiness tracking
- Real-time social media monitoring with intelligent caching
- Sentiment categorization and scoring
- API quota management with 24-hour cache

Key Features:
- T-Mobile tweet monitoring with keyword search
- Weighted sentiment analysis
- Confidence scoring for negative/positive posts
- Customer happiness metrics
- Intelligent caching to preserve API quota (100 free reads/month)
- 24-hour cache duration
- Automatic fallback to stale cache on API errors
"""

import os
import sys
from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

# Add the project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import our Twitter monitoring class
from twitter_utils.twitter_monitor import TwitterSentimentMonitor

# Create router
twitter_router = APIRouter(prefix="/api/twitter", tags=["twitter"])

# Pydantic models for response structure
class TwitterNegativeResponse(BaseModel):
    success: bool
    timestamp: str
    total_negative_posts: int
    from_cache: bool
    negative_posts: list

class TwitterHappinessResponse(BaseModel):
    success: bool
    timestamp: str
    total_positive_posts: int
    average_happiness_score: float
    from_cache: bool
    happiness_posts: list

class TwitterSentimentResponse(BaseModel):
    success: bool
    timestamp: str
    negative_data: Dict[str, Any]
    happiness_data: Dict[str, Any]
    overall_sentiment: Dict[str, Any]

# Initialize Twitter monitor (will be created per request to avoid auth issues)
def get_twitter_monitor():
    """Create a new Twitter monitor instance"""
    try:
        return TwitterSentimentMonitor()
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to initialize Twitter API client: {str(e)}. Please check your TWITTER_BEARER_TOKEN."
        )

@twitter_router.get("/negative", response_model=TwitterNegativeResponse)
async def get_twitter_negative(
    use_cache: bool = Query(default=True, description="Use cached data if available (saves API quota)"),
    max_results: int = Query(default=100, ge=10, le=100, description="Max tweets to fetch (if not using cache)")
):
    """
    Get T-Mobile negative sentiment tweets from Twitter/X
    
    Searches Twitter for user tweets mentioning T-Mobile with negative sentiment
    including service issues, outages, complaints, etc. Results are cached for
    24 hours to preserve API quota (100 free reads/month).
    
    Args:
        use_cache: Use cached data if available (default: True, recommended to save API quota)
        max_results: Maximum number of tweets to fetch from API (10-100, default: 100)
    
    Returns:
        JSON response with negative sentiment tweets, confidence scores, and cache status
    """
    try:
        monitor = get_twitter_monitor()
        result = monitor.get_negative_posts_api(max_results=max_results, use_cache=use_cache)
        
        if not result['success']:
            raise HTTPException(status_code=503, detail=result.get('error', 'Failed to fetch negative tweets'))
        
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
                'total_negative_posts': 0,
                'from_cache': False,
                'negative_posts': []
            }
        )

@twitter_router.get("/happiness", response_model=TwitterHappinessResponse)
async def get_twitter_happiness(
    use_cache: bool = Query(default=True, description="Use cached data if available (saves API quota)"),
    max_results: int = Query(default=100, ge=10, le=100, description="Max tweets to fetch (if not using cache)")
):
    """
    Get T-Mobile positive sentiment tweets for Customer Happiness Index
    
    Analyzes Twitter posts for positive sentiment indicators including service
    quality, network speed, customer service satisfaction, and feature praise.
    Results are cached for 24 hours to preserve API quota.
    
    Args:
        use_cache: Use cached data if available (default: True, recommended to save API quota)
        max_results: Maximum number of tweets to fetch from API (10-100, default: 100)
    
    Returns:
        JSON response with happiness tweets, scores, and cache status
    """
    try:
        monitor = get_twitter_monitor()
        result = monitor.get_positive_posts_api(max_results=max_results, use_cache=use_cache)
        
        if not result['success']:
            raise HTTPException(status_code=503, detail=result.get('error', 'Failed to fetch positive tweets'))
        
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
                'from_cache': False,
                'happiness_posts': []
            }
        )

@twitter_router.get("/sentiment", response_model=TwitterSentimentResponse)
async def get_twitter_sentiment(
    use_cache: bool = Query(default=True, description="Use cached data if available (saves API quota)"),
    max_results: int = Query(default=100, ge=10, le=100, description="Max tweets to fetch (if not using cache)")
):
    """
    Get comprehensive T-Mobile sentiment analysis from Twitter/X
    
    Provides complete sentiment analysis combining negative (complaints, issues)
    and positive (satisfaction, praise) indicators from Twitter. Includes overall
    sentiment metrics and engagement data. Uses caching to preserve API quota.
    
    Args:
        use_cache: Use cached data if available (default: True, recommended to save API quota)
        max_results: Maximum number of tweets to fetch from API (10-100, default: 100)
    
    Returns:
        JSON response with both negative and positive data plus overall sentiment metrics
    """
    try:
        monitor = get_twitter_monitor()
        
        # Get both negative and positive data
        negative_result = monitor.get_negative_posts_api(max_results=max_results, use_cache=use_cache)
        positive_result = monitor.get_positive_posts_api(max_results=max_results, use_cache=use_cache)
        
        # Calculate overall sentiment metrics
        total_negative = negative_result.get('total_negative_posts', 0)
        total_positive = positive_result.get('total_positive_posts', 0)
        avg_happiness = positive_result.get('average_happiness_score', 0)
        
        # Calculate overall sentiment score (0-1 scale)
        if total_negative + total_positive > 0:
            positive_ratio = total_positive / (total_negative + total_positive)
            overall_score = (positive_ratio * 0.7) + (avg_happiness * 0.3)
        else:
            overall_score = 0.5  # Neutral if no data
        
        # Determine sentiment classification
        if overall_score >= 0.7:
            sentiment_status = "Very Positive"
        elif overall_score >= 0.6:
            sentiment_status = "Positive"
        elif overall_score >= 0.4:
            sentiment_status = "Neutral"
        elif overall_score >= 0.3:
            sentiment_status = "Negative"
        else:
            sentiment_status = "Very Negative"
        
        # Calculate engagement metrics
        negative_engagement = sum(
            post.get('likes', 0) + post.get('retweets', 0) + post.get('replies', 0)
            for post in negative_result.get('negative_posts', [])
        )
        
        positive_engagement = sum(
            post.get('likes', 0) + post.get('retweets', 0) + post.get('replies', 0)
            for post in positive_result.get('happiness_posts', [])
        )
        
        overall_sentiment = {
            'overall_score': round(overall_score, 3),
            'sentiment_status': sentiment_status,
            'total_tweets_analyzed': total_negative + total_positive,
            'positive_tweets': total_positive,
            'negative_tweets': total_negative,
            'positive_ratio': round(positive_ratio if total_negative + total_positive > 0 else 0, 3)
        }
        
        engagement_summary = {
            'total_engagement': negative_engagement + positive_engagement,
            'negative_engagement': negative_engagement,
            'positive_engagement': positive_engagement,
            'engagement_ratio': round(
                positive_engagement / (negative_engagement + positive_engagement)
                if negative_engagement + positive_engagement > 0 else 0, 3
            )
        }
        
        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'from_cache': negative_result.get('from_cache', False) or positive_result.get('from_cache', False),
            'negative_data': negative_result,
            'happiness_data': positive_result,
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
                'from_cache': False,
                'negative_data': {'success': False, 'negative_posts': []},
                'happiness_data': {'success': False, 'happiness_posts': []},
                'overall_sentiment': {'overall_score': 0, 'sentiment_status': 'Error'},
                'engagement_summary': {'total_engagement': 0}
            }
        )

@twitter_router.get("/cache-status")
async def get_cache_status():
    """
    Get Twitter API cache status
    
    Returns information about cached data including timestamps, expiration,
    and whether cache is valid. Useful for monitoring API quota usage.
    
    Returns:
        JSON response with cache status for both negative and positive data
    """
    try:
        monitor = get_twitter_monitor()
        
        negative_valid = monitor.is_cache_valid(monitor.negative_cache_file)
        positive_valid = monitor.is_cache_valid(monitor.positive_cache_file)
        
        # Get cache file info
        negative_info = {}
        if monitor.negative_cache_file.exists():
            import json
            with open(monitor.negative_cache_file, 'r') as f:
                data = json.load(f)
            negative_info = {
                'cached_at': data.get('cached_at'),
                'expires_at': data.get('cache_expires_at'),
                'total_posts': data.get('total_negative_posts', 0)
            }
        
        positive_info = {}
        if monitor.positive_cache_file.exists():
            import json
            with open(monitor.positive_cache_file, 'r') as f:
                data = json.load(f)
            positive_info = {
                'cached_at': data.get('cached_at'),
                'expires_at': data.get('cache_expires_at'),
                'total_posts': data.get('total_positive_posts', 0)
            }
        
        return JSONResponse(content={
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'cache_duration_hours': monitor.cache_duration_hours,
            'negative_cache': {
                'valid': negative_valid,
                'exists': monitor.negative_cache_file.exists(),
                **negative_info
            },
            'positive_cache': {
                'valid': positive_valid,
                'exists': monitor.positive_cache_file.exists(),
                **positive_info
            },
            'recommendation': 'Use cache=true to save API quota (100 free reads/month)'
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Internal server error: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
        )

@twitter_router.post("/refresh-cache")
async def refresh_cache(
    max_results: int = Query(default=100, ge=10, le=100, description="Max tweets to fetch")
):
    """
    Manually refresh Twitter cache data
    
    Forces a fresh API call to Twitter to update cached data. Use this when you
    want the latest tweets and are willing to use API quota. This will reset
    the 24-hour cache timer.
    
    Args:
        max_results: Maximum number of tweets to fetch (10-100, default: 100)
    
    Returns:
        JSON response with refresh status and new data counts
    """
    try:
        monitor = get_twitter_monitor()
        
        # Force refresh by setting use_cache=False
        negative_result = monitor.get_negative_posts_api(max_results=max_results, use_cache=False)
        positive_result = monitor.get_positive_posts_api(max_results=max_results, use_cache=False)
        
        return JSONResponse(content={
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'message': 'Cache refreshed successfully',
            'api_calls_used': 1,  # One search call fetches both positive and negative
            'negative_posts_cached': negative_result.get('total_negative_posts', 0),
            'positive_posts_cached': positive_result.get('total_positive_posts', 0),
            'cache_expires_at': negative_result.get('cache_expires_at')
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Failed to refresh cache: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
        )

@twitter_router.get("/health")
async def twitter_health_check():
    """
    Health check endpoint for Twitter/X API functionality
    
    Verifies that Twitter API credentials are configured. Does NOT make an API
    call to preserve quota. Use /cache-status to check if cached data is available.
    
    Returns:
        JSON response with health status and configuration info
    """
    try:
        monitor = get_twitter_monitor()
        
        # Check if cache files exist (doesn't use API quota)
        has_negative_cache = monitor.negative_cache_file.exists()
        has_positive_cache = monitor.positive_cache_file.exists()
        
        negative_cache_valid = monitor.is_cache_valid(monitor.negative_cache_file)
        positive_cache_valid = monitor.is_cache_valid(monitor.positive_cache_file)
        
        return JSONResponse(content={
            'success': True,
            'message': 'Twitter API client initialized successfully',
            'timestamp': datetime.now().isoformat(),
            'api_version': 'Twitter API v2',
            'search_query': monitor.search_query,
            'cache_info': {
                'negative_cache_available': has_negative_cache and negative_cache_valid,
                'positive_cache_available': has_positive_cache and positive_cache_valid,
                'cache_duration_hours': monitor.cache_duration_hours
            },
            'api_quota': {
                'free_tier_limit': '100 reads per month',
                'recommendation': 'Use cache=true parameter to preserve quota'
            }
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                'success': False,
                'message': 'Twitter API client initialization failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'help': 'Please check your TWITTER_BEARER_TOKEN environment variable'
            }
        )

# Export router
__all__ = ['twitter_router']

