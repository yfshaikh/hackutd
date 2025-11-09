"""
Reddit Routes - HTTP API endpoints for T-Mobile sentiment analysis via Reddit

This module provides REST API endpoints for T-Mobile Customer Happiness Index:
- Reddit outage detection from T-Mobile related subreddits
- Positive sentiment analysis for customer happiness tracking
- Real-time social media monitoring
- Sentiment categorization and scoring

Key Features:
- T-Mobile focused subreddit monitoring
- Weighted sentiment analysis
- Outage detection with confidence scoring
- Customer happiness metrics
- Error handling and data validation
"""

import os
import sys
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

# Add the project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import our Reddit monitoring classes
from reddit_utils.reddit import RedditSentimentMonitor
from reddit_utils.sentiment_history import RedditSentimentHistory

# Create routers
reddit_router = APIRouter(prefix="/api/reddit", tags=["reddit"])
dashboard_router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Pydantic models for response structure
class RedditOutageResponse(BaseModel):
    success: bool
    timestamp: str
    total_outage_posts: int
    outages: list

class RedditHappinessResponse(BaseModel):
    success: bool
    timestamp: str
    total_positive_posts: int
    average_happiness_score: float
    category_breakdown: Dict[str, int]
    happiness_posts: list

class CombinedSentimentResponse(BaseModel):
    success: bool
    timestamp: str
    outage_data: Dict[str, Any]
    happiness_data: Dict[str, Any]
    overall_sentiment: Dict[str, Any]

# Initialize Reddit monitor (will be created per request to avoid auth issues)
def get_reddit_monitor():
    """Create a new Reddit monitor instance"""
    try:
        return RedditSentimentMonitor()
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Failed to initialize Reddit API client: {str(e)}. Please check your Reddit API credentials."
        )

# Dashboard Routes
@dashboard_router.get("/sentiment-history")
async def get_sentiment_history():
    """
    Get historical sentiment data for the past 6 months
    
    Returns monthly aggregated sentiment data showing positive vs negative
    post counts over time for dashboard visualization.
    
    Returns:
        JSON response with historical sentiment data
    """
    try:
        analyzer = RedditSentimentHistory()
        result = analyzer.analyze_historical_sentiment(months_back=6)
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Failed to analyze historical sentiment: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
        )

@dashboard_router.get("/recent-sentiment")
async def get_recent_sentiment():
    """
    Get recent sentiment summary from both Reddit and Twitter
    
    Returns aggregated sentiment data for the dashboard quick stats
    and overall sentiment indicators combining both platforms.
    
    Returns:
        JSON response with recent sentiment summary
    """
    try:
        # Get Reddit sentiment
        analyzer = RedditSentimentHistory()
        reddit_result = analyzer.get_recent_sentiment_summary(days_back=7)
        
        # Try to get Twitter sentiment (if available)
        twitter_positive = 0
        twitter_negative = 0
        twitter_available = False
        
        print("=" * 80)
        print("🐦 Attempting to fetch Twitter sentiment data...")
        try:
            from twitter_utils.twitter_monitor import TwitterSentimentMonitor
            print("✅ Twitter monitor module imported successfully")
            
            twitter_monitor = TwitterSentimentMonitor()
            print("✅ Twitter monitor initialized successfully")
            
            # Get Twitter data from cache
            print("📊 Fetching Twitter negative posts...")
            twitter_neg = twitter_monitor.get_negative_posts_api(max_results=100, use_cache=True)
            print(f"   Result: {twitter_neg.get('success', False)}, From cache: {twitter_neg.get('from_cache', False)}")
            
            print("📊 Fetching Twitter positive posts...")
            twitter_pos = twitter_monitor.get_positive_posts_api(max_results=100, use_cache=True)
            print(f"   Result: {twitter_pos.get('success', False)}, From cache: {twitter_pos.get('from_cache', False)}")
            
            if twitter_neg.get('success'):
                twitter_negative = twitter_neg.get('total_negative_posts', 0)
                twitter_available = True
                print(f"✅ Twitter negative posts: {twitter_negative}")
            else:
                print(f"❌ Failed to get Twitter negative posts: {twitter_neg.get('error', 'Unknown error')}")
            
            if twitter_pos.get('success'):
                twitter_positive = twitter_pos.get('total_positive_posts', 0)
                twitter_available = True
                print(f"✅ Twitter positive posts: {twitter_positive}")
            else:
                print(f"❌ Failed to get Twitter positive posts: {twitter_pos.get('error', 'Unknown error')}")
                
            if twitter_available:
                print(f"🎉 Twitter API integration working! Total posts: {twitter_positive + twitter_negative}")
            else:
                print("⚠️  Twitter API returned no data")
                
        except ImportError as import_error:
            print(f"❌ Twitter module import failed: {import_error}")
            print("   Check if twitter_utils/twitter_monitor.py exists")
        except Exception as twitter_error:
            print(f"❌ Twitter data fetch failed: {type(twitter_error).__name__}: {twitter_error}")
            import traceback
            print(f"   Traceback: {traceback.format_exc()}")
        print("=" * 80)
        
        # Combine Reddit and Twitter data
        reddit_positive = reddit_result.get('positive_count', 0)
        reddit_negative = reddit_result.get('negative_count', 0)
        
        total_positive = reddit_positive + twitter_positive
        total_negative = reddit_negative + twitter_negative
        total_posts = total_positive + total_negative + reddit_result.get('neutral_count', 0)
        
        # Calculate combined sentiment ratio
        sentiment_ratio = total_positive / (total_positive + total_negative) if (total_positive + total_negative) > 0 else 0.5
        sentiment_score = (sentiment_ratio - 0.5) * 2  # -1 to 1 scale
        
        result = {
            'success': True,
            'period_days': 7,
            'positive_count': total_positive,
            'negative_count': total_negative,
            'neutral_count': reddit_result.get('neutral_count', 0),
            'total_posts': total_posts,
            'sentiment_ratio': round(sentiment_ratio, 3),
            'sentiment_score': round(sentiment_score, 3),
            'timestamp': datetime.now().isoformat(),
            'platforms_included': ['reddit'] + (['twitter'] if twitter_available else []),
            'breakdown': {
                'reddit': {
                    'positive': reddit_positive,
                    'negative': reddit_negative,
                    'neutral': reddit_result.get('neutral_count', 0)
                },
                'twitter': {
                    'positive': twitter_positive,
                    'negative': twitter_negative,
                    'neutral': 0
                } if twitter_available else None
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Failed to get recent sentiment: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
        )

@dashboard_router.get("/combined-recent-posts")
async def get_combined_recent_posts(
    limit: int = Query(default=10, ge=5, le=50, description="Number of recent posts to return")
):
    """
    Get recent social media posts from both Reddit and Twitter/X
    
    Fetches and combines the most recent posts about T-Mobile from both Reddit
    and Twitter, including positive and negative sentiment posts. Posts are 
    sorted by timestamp to show the most recent activity across platforms.
    
    Args:
        limit: Number of posts to return (5-50, default 10)
    
    Returns:
        JSON response with combined posts from both platforms
    """
    try:
        # Import Twitter monitor here to avoid circular imports
        print("\n" + "=" * 80)
        print("🚀 Starting combined posts fetch...")
        try:
            from twitter_utils.twitter_monitor import TwitterSentimentMonitor
            twitter_available = True
            print("✅ Twitter monitor module is available")
        except ImportError as import_error:
            twitter_available = False
            print(f"⚠️  Twitter monitor not available: {import_error}")
        print("=" * 80 + "\n")
        
        all_posts = []
        
        # Get Reddit posts
        try:
            monitor = get_reddit_monitor()
            negative_result = monitor.scan_for_outages_api(limit_per_subreddit=20)
            positive_result = monitor.scan_for_happiness_api(limit_per_subreddit=20)
            
            # Add negative posts
            negative_posts_list = negative_result.get('outages') or negative_result.get('negative_posts', [])
            if negative_result.get('success') and negative_posts_list:
                for post in negative_posts_list:
                    all_posts.append({
                        **post,
                        'sentiment': 'negative',
                        'platform': 'reddit',
                        'created_timestamp': datetime.fromisoformat(post['created_utc']).timestamp()
                    })
            
            # Add positive posts
            if positive_result.get('success') and positive_result.get('happiness_posts'):
                for post in positive_result['happiness_posts']:
                    all_posts.append({
                        **post,
                        'sentiment': 'positive',
                        'platform': 'reddit',
                        'created_timestamp': datetime.fromisoformat(post['created_utc']).timestamp()
                    })
        except Exception as e:
            print(f"Error fetching Reddit posts: {e}")
        
        # Get Twitter posts if available
        if twitter_available:
            print("\n" + "=" * 80)
            print("🐦 Attempting to fetch Twitter posts for combined feed...")
            try:
                twitter_monitor = TwitterSentimentMonitor()
                print("✅ Twitter monitor initialized for posts fetch")
                
                # Get Twitter negative posts
                print("📊 Fetching Twitter negative posts...")
                twitter_negative = twitter_monitor.get_negative_posts_api(max_results=100, use_cache=True)
                if twitter_negative.get('success') and twitter_negative.get('negative_posts'):
                    twitter_neg_count = len(twitter_negative['negative_posts'])
                    print(f"✅ Found {twitter_neg_count} Twitter negative posts")
                    for post in twitter_negative['negative_posts']:
                        all_posts.append({
                            'id': post['id'],
                            'title': post.get('text', '')[:100],  # First 100 chars as title
                            'content': post.get('text', ''),
                            'author': post.get('author', 'Unknown'),
                            'created_utc': post.get('created_at', datetime.now().isoformat()),
                            'score': post.get('likes', 0),
                            'num_comments': post.get('replies', 0),
                            'url': post.get('url', ''),
                            'sentiment': 'negative',
                            'platform': 'twitter',
                            'confidence_score': post.get('confidence_score', 0),
                            'keywords_found': post.get('keywords_found', []),
                            'likes': post.get('likes', 0),
                            'retweets': post.get('retweets', 0),
                            'replies': post.get('replies', 0),
                            'created_timestamp': datetime.fromisoformat(post.get('created_at', datetime.now().isoformat())).timestamp()
                        })
                else:
                    print(f"⚠️  No Twitter negative posts found")
                
                # Get Twitter positive posts
                print("📊 Fetching Twitter positive posts...")
                twitter_positive = twitter_monitor.get_positive_posts_api(max_results=100, use_cache=True)
                if twitter_positive.get('success') and twitter_positive.get('happiness_posts'):
                    twitter_pos_count = len(twitter_positive['happiness_posts'])
                    print(f"✅ Found {twitter_pos_count} Twitter positive posts")
                    for post in twitter_positive['happiness_posts']:
                        all_posts.append({
                            'id': post['id'],
                            'title': post.get('text', '')[:100],  # First 100 chars as title
                            'content': post.get('text', ''),
                            'author': post.get('author', 'Unknown'),
                            'created_utc': post.get('created_at', datetime.now().isoformat()),
                            'score': post.get('likes', 0),
                            'num_comments': post.get('replies', 0),
                            'url': post.get('url', ''),
                            'sentiment': 'positive',
                            'platform': 'twitter',
                            'happiness_score': post.get('happiness_score', 0),
                            'category': post.get('category', ''),
                            'keywords_found': post.get('keywords_found', []),
                            'likes': post.get('likes', 0),
                            'retweets': post.get('retweets', 0),
                            'replies': post.get('replies', 0),
                            'created_timestamp': datetime.fromisoformat(post.get('created_at', datetime.now().isoformat())).timestamp()
                        })
                else:
                    print(f"⚠️  No Twitter positive posts found")
                    
                print(f"🎉 Twitter posts fetch complete!")
            except Exception as e:
                print(f"❌ Error fetching Twitter posts: {type(e).__name__}: {e}")
                import traceback
                print(f"   Traceback: {traceback.format_exc()}")
            print("=" * 80 + "\n")
        
        # Sort by timestamp (most recent first) and limit
        all_posts.sort(key=lambda x: x['created_timestamp'], reverse=True)
        recent_posts = all_posts[:limit]
        
        # Remove the temporary timestamp field
        for post in recent_posts:
            del post['created_timestamp']
        
        # Count final posts by platform
        platform_counts = {}
        for post in recent_posts:
            platform = post.get('platform', 'unknown')
            platform_counts[platform] = platform_counts.get(platform, 0) + 1
        
        print("\n" + "=" * 80)
        print("📊 Combined Posts Summary:")
        print(f"   Total posts returned: {len(recent_posts)}")
        print(f"   Platform breakdown: {platform_counts}")
        print(f"   Platforms included: {['reddit'] + (['twitter'] if twitter_available else [])}")
        print("=" * 80 + "\n")
        
        return JSONResponse(content={
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'total_posts': len(recent_posts),
            'posts': recent_posts,
            'platforms_included': ['reddit'] + (['twitter'] if twitter_available else [])
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Internal server error: {str(e)}',
                'timestamp': datetime.now().isoformat(),
                'total_posts': 0,
                'posts': []
            }
        )

@reddit_router.get("/outages", response_model=RedditOutageResponse)
async def get_reddit_outages(
    limit: int = Query(default=30, ge=5, le=100, description="Number of posts to fetch per subreddit")
):
    """
    Get T-Mobile outage reports from Reddit
    
    Scans T-Mobile related subreddits for posts indicating service outages,
    network issues, or connectivity problems. Returns posts with confidence
    scores based on keyword analysis.
    
    Args:
        limit: Number of posts to fetch per subreddit (5-100)
    
    Returns:
        JSON response with outage posts, confidence scores, and metadata
    """
    try:
        monitor = get_reddit_monitor()
        result = monitor.scan_for_outages_api(limit_per_subreddit=limit)
        
        if not result['success']:
            raise HTTPException(status_code=503, detail=result.get('error', 'Failed to fetch outage data'))
        
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

@reddit_router.get("/happiness", response_model=RedditHappinessResponse)
async def get_reddit_happiness(
    limit: int = Query(default=30, ge=5, le=100, description="Number of posts to fetch per subreddit")
):
    """
    Get T-Mobile positive sentiment data for Customer Happiness Index
    
    Analyzes T-Mobile related posts for positive sentiment indicators including
    service quality, network speed, customer service, and feature satisfaction.
    Provides categorized happiness metrics.
    
    Args:
        limit: Number of posts to fetch per subreddit (5-100)
    
    Returns:
        JSON response with happiness posts, scores, and category breakdown
    """
    try:
        monitor = get_reddit_monitor()
        result = monitor.scan_for_happiness_api(limit_per_subreddit=limit)
        
        if not result['success']:
            raise HTTPException(status_code=503, detail=result.get('error', 'Failed to fetch happiness data'))
        
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
                'category_breakdown': {},
                'happiness_posts': []
            }
        )

@reddit_router.get("/sentiment", response_model=CombinedSentimentResponse)
async def get_combined_sentiment(
    limit: int = Query(default=30, ge=5, le=100, description="Number of posts to fetch per subreddit")
):
    """
    Get comprehensive T-Mobile sentiment analysis combining outages and happiness
    
    Provides a complete view of T-Mobile customer sentiment by analyzing both
    negative (outages, issues) and positive (satisfaction, praise) indicators
    from Reddit discussions. Includes overall sentiment metrics.
    
    Args:
        limit: Number of posts to fetch per subreddit (5-100)
    
    Returns:
        JSON response with both outage and happiness data plus overall sentiment metrics
    """
    try:
        monitor = get_reddit_monitor()
        
        # Get both outage and happiness data
        outage_result = monitor.scan_for_outages_api(limit_per_subreddit=limit)
        happiness_result = monitor.scan_for_happiness_api(limit_per_subreddit=limit)
        
        # Calculate overall sentiment metrics
        total_outages = outage_result.get('total_outage_posts', 0)
        total_positive = happiness_result.get('total_positive_posts', 0)
        avg_happiness = happiness_result.get('average_happiness_score', 0)
        
        # Calculate overall sentiment score (0-1 scale)
        if total_outages + total_positive > 0:
            positive_ratio = total_positive / (total_outages + total_positive)
            overall_score = (positive_ratio * 0.7) + (avg_happiness * 0.3)  # Weight positive ratio more
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
        
        overall_sentiment = {
            'overall_score': round(overall_score, 3),
            'sentiment_status': sentiment_status,
            'total_posts_analyzed': total_outages + total_positive,
            'positive_posts': total_positive,
            'negative_posts': total_outages,
            'positive_ratio': round(positive_ratio if total_outages + total_positive > 0 else 0, 3)
        }
        
        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'outage_data': outage_result,
            'happiness_data': happiness_result,
            'overall_sentiment': overall_sentiment
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
                'overall_sentiment': {'overall_score': 0, 'sentiment_status': 'Error'}
            }
        )

@reddit_router.get("/recent-posts")
async def get_recent_posts(
    limit: int = Query(default=10, ge=5, le=50, description="Number of recent posts to return")
):
    """
    Get recent T-Mobile social media posts (both positive and negative)
    
    Fetches the most recent posts about T-Mobile from Reddit, combining both
    positive and negative sentiment posts. Posts are sorted by timestamp to
    show the most recent activity.
    
    Args:
        limit: Number of posts to return (5-50, default 10)
    
    Returns:
        JSON response with recent posts including title, content, author, url, and sentiment
    """
    try:
        monitor = get_reddit_monitor()
        
        # Get both positive and negative posts
        negative_result = monitor.scan_for_outages_api(limit_per_subreddit=20)
        positive_result = monitor.scan_for_happiness_api(limit_per_subreddit=20)
        
        # Combine posts
        all_posts = []
        
        # Add negative posts with sentiment marker (check for both 'outages' and 'negative_posts')
        negative_posts_list = negative_result.get('outages') or negative_result.get('negative_posts', [])
        if negative_result.get('success') and negative_posts_list:
            for post in negative_posts_list:
                all_posts.append({
                    **post,
                    'sentiment': 'negative',
                    'created_timestamp': datetime.fromisoformat(post['created_utc']).timestamp()
                })
        
        # Add positive posts with sentiment marker
        if positive_result.get('success') and positive_result.get('happiness_posts'):
            for post in positive_result['happiness_posts']:
                all_posts.append({
                    **post,
                    'sentiment': 'positive',
                    'created_timestamp': datetime.fromisoformat(post['created_utc']).timestamp()
                })
        
        # Sort by timestamp (most recent first) and limit
        all_posts.sort(key=lambda x: x['created_timestamp'], reverse=True)
        recent_posts = all_posts[:limit]
        
        # Remove the temporary timestamp field
        for post in recent_posts:
            del post['created_timestamp']
        
        return JSONResponse(content={
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'total_posts': len(recent_posts),
            'posts': recent_posts
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                'success': False,
                'error': f'Internal server error: {str(e)}',
                'timestamp': datetime.now().isoformat(),
                'total_posts': 0,
                'posts': []
            }
        )

@reddit_router.get("/health")
async def reddit_health_check():
    """
    Health check endpoint for Reddit API functionality
    
    Verifies that Reddit API credentials are configured and accessible.
    Use this endpoint to test Reddit integration before making data requests.
    
    Returns:
        JSON response with health status and configuration info
    """
    try:
        monitor = get_reddit_monitor()
        
        # Try to access Reddit API (this will fail if credentials are invalid)
        test_subreddit = monitor.reddit.subreddit('tmobile')
        
        # If we can access the subreddit info, credentials are working
        subreddit_info = {
            'name': test_subreddit.display_name,
            'subscribers': test_subreddit.subscribers,
            'public_description': test_subreddit.public_description[:100] + '...' if test_subreddit.public_description else None
        }
        
        return JSONResponse(content={
            'success': True,
            'message': 'Reddit API is accessible',
            'timestamp': datetime.now().isoformat(),
            'target_subreddits': monitor.target_subreddits,
            'test_subreddit_info': subreddit_info
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                'success': False,
                'message': 'Reddit API is not accessible',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'help': 'Please check your Reddit API credentials (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT)'
            }
        )

# Export both routers
__all__ = ['reddit_router', 'dashboard_router']
