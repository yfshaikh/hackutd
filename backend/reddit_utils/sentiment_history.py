import praw
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
import os
from dataclasses import dataclass
from collections import defaultdict
import calendar
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

@dataclass
class SentimentTimePoint:
    """Data class to represent sentiment data for a specific time period"""
    timestamp: datetime
    positive_count: int
    negative_count: int
    neutral_count: int
    total_posts: int
    sentiment_ratio: float  # positive / (positive + negative), 0-1 scale

class RedditSentimentHistory:
    def __init__(self):
        """Initialize Reddit API client for historical sentiment analysis"""
        self.reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID', 'your_client_id'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET', 'your_client_secret'),
            user_agent=os.getenv('REDDIT_USER_AGENT', 'sentiment_history/1.0 by OkCommunication9478'),
            check_for_async=False  # Disable async environment check as recommended for FastAPI
        )
        
        # T-Mobile focused subreddits
        self.target_subreddits = [
            'tmobile',
            'Sprint',
            'MetroPCS',
            'mintmobile',
            # 'cellphones',
            # 'NoContract'
        ]
        
        # Cache settings (for demo purposes)
        self.cache_duration_hours = 24  # Cache data for 24 hours
        self.cache_dir = Path(__file__).parent.parent  # backend directory
        self.historical_cache_file = self.cache_dir / 'reddit_historical_sentiment_cache.json'
        self.recent_cache_file = self.cache_dir / 'reddit_recent_sentiment_cache.json'
        
        # Negative sentiment keywords (expanded from outage-specific to general negative)
        self.negative_keywords = {
            'service_issues': [
                'outage', 'outages', 'down', 'service down', 'network down',
                'not working', 'connection issues', 'connectivity issues',
                'service interruption', 'network issues', 'signal issues',
                'no service', 'no signal', 'dropped calls', 'slow data',
                'can\'t connect', 'cannot connect', 'connection problems',
                'network problems', 'service problems', 'technical difficulties'
            ],
            'quality_complaints': [
                'terrible service', 'awful service', 'horrible service', 'worst service',
                'poor coverage', 'bad coverage', 'weak signal', 'no bars',
                'slow internet', 'slow speeds', 'throttling', 'deprioritized',
                'overpriced', 'expensive', 'rip off', 'scam', 'fraud'
            ],
            'customer_service_issues': [
                'rude staff', 'unhelpful', 'terrible support', 'worst customer service',
                'hung up on me', 'long wait times', 'can\'t reach anyone',
                'poor customer service', 'incompetent staff', 'lied to me'
            ],
            'billing_issues': [
                'unexpected charges', 'hidden fees', 'billing error', 'overcharged',
                'wrong bill', 'billing issues', 'can\'t pay bill', 'account suspended',
                'collections', 'credit check failed'
            ],
            'general_negative': [
                'hate tmobile', 'hate t-mobile', 'worst carrier', 'switching carriers',
                'leaving tmobile', 'cancel service', 'disappointed', 'frustrated',
                'angry', 'furious', 'fed up', 'never again', 'regret signing up'
            ]
        }
        
        # Positive sentiment keywords
        self.positive_keywords = {
            'service_praise': [
                'excellent service', 'amazing service', 'great service', 'outstanding service',
                'perfect service', 'fantastic service', 'superb service', 'wonderful service',
                'love the service', 'incredible service'
            ],
            'speed_praise': [
                'fast internet', 'blazing fast', 'super fast', 'lightning fast', 'incredible speed',
                'amazing speed', 'excellent speed', 'great speeds', 'fastest network',
                'best speeds', 'perfect speed', '5g is amazing'
            ],
            'coverage_praise': [
                'great coverage', 'excellent coverage', 'amazing coverage', 'perfect coverage',
                'strong signal', 'full bars', 'excellent signal', 'great reception',
                'works everywhere', 'never lose signal'
            ],
            'customer_service_praise': [
                'helpful staff', 'amazing support', 'great customer service', 'friendly staff',
                'excellent help', 'wonderful support', 'best customer service',
                'solved my problem', 'very helpful', 'professional staff'
            ],
            'general_positive': [
                'love tmobile', 'love t-mobile', 'best carrier', 'highly recommend',
                'so happy', 'very satisfied', 'extremely happy', 'couldn\'t be happier',
                'impressed', 'exceeded expectations', 'blown away', 'fantastic experience',
                'perfect choice', 'glad I switched'
            ],
            'value_praise': [
                'great value', 'best price', 'affordable', 'good deal', 'worth it',
                'cheap plans', 'unlimited data', 'no throttling', 'free netflix',
                'tuesday deals', 'magenta max', 'uncarrier benefits'
            ]
        }
        
        # T-Mobile specific keywords
        self.tmobile_keywords = [
            't-mobile', 'tmobile', 't mobile', 'magenta', 'uncarrier',
            'sprint', 'metro', 'metro by t-mobile', 'mint mobile'
        ]

    def is_cache_valid(self, cache_file: Path) -> bool:
        """Check if cache file exists and is still valid"""
        if not cache_file.exists():
            return False
        
        try:
            with open(cache_file, 'r') as f:
                data = json.load(f)
            
            cached_time = datetime.fromisoformat(data.get('cached_at', ''))
            cache_age = datetime.now() - cached_time
            
            return cache_age.total_seconds() < (self.cache_duration_hours * 3600)
        except Exception as e:
            print(f"Error checking cache validity: {e}")
            return False

    def load_from_cache(self, cache_file: Path) -> Dict[str, Any]:
        """Load data from cache file"""
        try:
            with open(cache_file, 'r') as f:
                data = json.load(f)
            print(f"✅ Loaded data from cache: {cache_file.name}")
            return data
        except Exception as e:
            print(f"❌ Error loading cache: {e}")
            return {}

    def save_to_cache(self, cache_file: Path, data: Dict[str, Any]):
        """Save data to cache file"""
        try:
            data['cached_at'] = datetime.now().isoformat()
            data['cache_expires_at'] = (datetime.now() + timedelta(hours=self.cache_duration_hours)).isoformat()
            
            with open(cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"✅ Saved data to cache: {cache_file.name}")
        except Exception as e:
            print(f"❌ Error saving cache: {e}")

    def is_tmobile_related(self, text: str) -> bool:
        """Check if text is related to T-Mobile"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.tmobile_keywords)

    def analyze_sentiment(self, text: str) -> tuple[str, float, List[str]]:
        """
        Analyze sentiment of text
        Returns: (sentiment, confidence_score, keywords_found)
        sentiment: 'positive', 'negative', or 'neutral'
        """
        text_lower = text.lower()
        positive_keywords_found = []
        negative_keywords_found = []
        positive_score = 0.0
        negative_score = 0.0
        
        # Check for positive keywords
        for category, keywords in self.positive_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    positive_keywords_found.append(keyword)
                    # Weight different categories
                    if category in ['service_praise', 'customer_service_praise']:
                        positive_score += 2.5
                    elif category in ['speed_praise', 'coverage_praise']:
                        positive_score += 2.0
                    elif category == 'value_praise':
                        positive_score += 1.5
                    else:  # general_positive
                        positive_score += 1.0
        
        # Check for negative keywords
        for category, keywords in self.negative_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    negative_keywords_found.append(keyword)
                    # Weight different categories
                    if category in ['service_issues', 'quality_complaints']:
                        negative_score += 2.5
                    elif category in ['customer_service_issues', 'billing_issues']:
                        negative_score += 2.0
                    else:  # general_negative
                        negative_score += 1.5
        
        # Determine overall sentiment
        if positive_score > negative_score and positive_score > 1.0:
            return 'positive', min(positive_score / 5.0, 1.0), positive_keywords_found
        elif negative_score > positive_score and negative_score > 1.0:
            return 'negative', min(negative_score / 5.0, 1.0), negative_keywords_found
        else:
            return 'neutral', 0.0, []

    def fetch_posts_for_timeframe(self, subreddit_name: str, start_date: datetime, end_date: datetime, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch posts from a subreddit within a specific timeframe
        Note: This uses search with timestamp filtering since Reddit API doesn't allow direct historical queries
        """
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            posts = []
            
            # Use search to get posts within timeframe
            # Search for T-Mobile related terms within the date range
            search_terms = ['tmobile OR "t-mobile" OR "t mobile" OR sprint OR metro OR magenta']
            
            for term in search_terms:
                try:
                    # Use pushshift-style search (may not work with all Reddit instances)
                    search_results = subreddit.search(
                        query=term, 
                        sort='new', 
                        time_filter='all',
                        limit=limit
                    )
                    
                    for submission in search_results:
                        created_date = datetime.fromtimestamp(submission.created_utc)
                        
                        # Filter by date range
                        if start_date <= created_date <= end_date:
                            post_data = {
                                'title': submission.title,
                                'content': submission.selftext,
                                'author': str(submission.author) if submission.author else '[deleted]',
                                'created_utc': created_date,
                                'score': submission.score,
                                'num_comments': submission.num_comments,
                                'post_id': submission.id
                            }
                            posts.append(post_data)
                except Exception as search_error:
                    print(f"Search error in r/{subreddit_name}: {str(search_error)}")
                    continue
            
            # Remove duplicates based on post_id
            unique_posts = {post['post_id']: post for post in posts}
            return list(unique_posts.values())
            
        except Exception as e:
            print(f"Error fetching posts from r/{subreddit_name}: {str(e)}")
            return []

    def analyze_historical_sentiment(self, months_back: int = 6, use_cache: bool = True) -> Dict[str, Any]:
        """
        Analyze sentiment over the past N months, returning monthly aggregated data
        
        Args:
            months_back: Number of months to analyze
            use_cache: If True, use cached data if available (recommended for demos)
        """
        # Check cache first if enabled
        if use_cache and self.is_cache_valid(self.historical_cache_file):
            print("📦 Using cached historical sentiment data")
            cached_data = self.load_from_cache(self.historical_cache_file)
            if cached_data:
                return cached_data
        
        print("🔍 Fetching fresh historical sentiment data...")
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months_back * 30)  # Approximate months
        
        print(f"Analyzing sentiment from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
        # Create monthly buckets
        monthly_data = defaultdict(lambda: {
            'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0
        })
        
        all_posts_analyzed = 0
        
        for subreddit in self.target_subreddits:
            print(f"Analyzing r/{subreddit}...")
            posts = self.fetch_posts_for_timeframe(subreddit, start_date, end_date, limit=200)
            
            for post in posts:
                # Check if it's T-Mobile related
                full_text = f"{post['title']} {post['content']}"
                if not self.is_tmobile_related(full_text):
                    continue
                
                # Analyze sentiment
                sentiment, confidence, keywords = self.analyze_sentiment(full_text)
                
                # Only count posts with some confidence
                if sentiment != 'neutral' and confidence > 0.3:
                    # Group by month
                    month_key = post['created_utc'].strftime('%Y-%m')
                    monthly_data[month_key][sentiment] += 1
                    monthly_data[month_key]['total'] += 1
                    all_posts_analyzed += 1
        
        # Convert to time series data
        time_series = []
        for month_key in sorted(monthly_data.keys()):
            data = monthly_data[month_key]
            if data['total'] > 0:  # Only include months with data
                year, month = map(int, month_key.split('-'))
                # Use the first day of the month for timestamp
                timestamp = datetime(year, month, 1)
                
                sentiment_ratio = data['positive'] / (data['positive'] + data['negative']) if (data['positive'] + data['negative']) > 0 else 0.5
                
                time_point = SentimentTimePoint(
                    timestamp=timestamp,
                    positive_count=data['positive'],
                    negative_count=data['negative'],
                    neutral_count=data['neutral'],
                    total_posts=data['total'],
                    sentiment_ratio=sentiment_ratio
                )
                time_series.append(time_point)
        
        # Calculate overall statistics
        total_positive = sum(point.positive_count for point in time_series)
        total_negative = sum(point.negative_count for point in time_series)
        total_posts = sum(point.total_posts for point in time_series)
        
        overall_sentiment_ratio = total_positive / (total_positive + total_negative) if (total_positive + total_negative) > 0 else 0.5
        
        result = {
            'success': True,
            'analysis_period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'months_analyzed': months_back
            },
            'overall_statistics': {
                'total_posts_analyzed': total_posts,
                'total_positive': total_positive,
                'total_negative': total_negative,
                'overall_sentiment_ratio': round(overall_sentiment_ratio, 3),
                'sentiment_score': round((overall_sentiment_ratio - 0.5) * 2, 3)  # -1 to 1 scale
            },
            'monthly_data': [
                {
                    'month': point.timestamp.strftime('%Y-%m'),
                    'timestamp': point.timestamp.isoformat(),
                    'positive_count': point.positive_count,
                    'negative_count': point.negative_count,
                    'neutral_count': point.neutral_count,
                    'total_posts': point.total_posts,
                    'sentiment_ratio': round(point.sentiment_ratio, 3)
                }
                for point in time_series
            ],
            'timestamp': datetime.now().isoformat()
        }
        
        # Save to cache
        self.save_to_cache(self.historical_cache_file, result)
        
        return result

    def get_recent_sentiment_summary(self, days_back: int = 7, use_cache: bool = True) -> Dict[str, Any]:
        """
        Get a quick sentiment summary for recent posts (for API usage)
        
        Args:
            days_back: Number of days to analyze
            use_cache: If True, use cached data if available (recommended for demos)
        """
        # Check cache first if enabled
        if use_cache and self.is_cache_valid(self.recent_cache_file):
            print("📦 Using cached recent sentiment data")
            cached_data = self.load_from_cache(self.recent_cache_file)
            if cached_data:
                return cached_data
        
        print("🔍 Fetching fresh recent sentiment data...")
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        
        for subreddit in self.target_subreddits:
            posts = self.fetch_posts_for_timeframe(subreddit, start_date, end_date, limit=50)
            
            for post in posts:
                full_text = f"{post['title']} {post['content']}"
                if not self.is_tmobile_related(full_text):
                    continue
                
                sentiment, confidence, keywords = self.analyze_sentiment(full_text)
                if confidence > 0.3:
                    if sentiment == 'positive':
                        positive_count += 1
                    elif sentiment == 'negative':
                        negative_count += 1
                    else:
                        neutral_count += 1
        
        total = positive_count + negative_count + neutral_count
        sentiment_ratio = positive_count / (positive_count + negative_count) if (positive_count + negative_count) > 0 else 0.5
        
        result = {
            'success': True,
            'period_days': days_back,
            'positive_count': positive_count,
            'negative_count': negative_count,
            'neutral_count': neutral_count,
            'total_posts': total,
            'sentiment_ratio': round(sentiment_ratio, 3),
            'sentiment_score': round((sentiment_ratio - 0.5) * 2, 3),
            'timestamp': datetime.now().isoformat()
        }
        
        # Save to cache
        self.save_to_cache(self.recent_cache_file, result)
        
        return result

def main():
    """Main function to run historical sentiment analysis"""
    analyzer = RedditSentimentHistory()
    
    try:
        # Analyze 6 months of historical data
        results = analyzer.analyze_historical_sentiment(months_back=6)
        
        # Save results to JSON
        with open('reddit_sentiment_history.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"Historical sentiment analysis complete!")
        print(f"Total posts analyzed: {results['overall_statistics']['total_posts_analyzed']}")
        print(f"Positive posts: {results['overall_statistics']['total_positive']}")
        print(f"Negative posts: {results['overall_statistics']['total_negative']}")
        print(f"Overall sentiment ratio: {results['overall_statistics']['overall_sentiment_ratio']}")
        print(f"Results saved to reddit_sentiment_history.json")
        
        return results
        
    except Exception as e:
        print(f"Error running sentiment analysis: {str(e)}")
        return None

if __name__ == "__main__":
    main()
