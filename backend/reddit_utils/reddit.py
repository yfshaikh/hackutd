import praw
import re
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os
from dataclasses import dataclass
from pathlib import Path

@dataclass
class NegativePost:
    """Data class to represent a negative sentiment post"""
    title: str
    content: str
    author: str
    created_utc: datetime
    score: int
    num_comments: int
    url: str
    subreddit: str
    post_id: str
    negative_keywords_found: List[str]
    confidence_score: float

@dataclass
class HappinessPost:
    """Data class to represent a positive sentiment post for Customer Happiness Index"""
    title: str
    content: str
    author: str
    created_utc: datetime
    score: int
    num_comments: int
    url: str
    subreddit: str
    post_id: str
    positive_keywords_found: List[str]
    happiness_score: float
    category: str  # Type of positive feedback (service, speed, coverage, etc.)

class RedditSentimentMonitor:
    def __init__(self):
        """Initialize Reddit API client"""
        # Reddit API credentials - you'll need to register your app at https://www.reddit.com/prefs/apps
        self.reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID', 'your_client_id'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET', 'your_client_secret'),
            user_agent=os.getenv('REDDIT_USER_AGENT', 'sentiment_monitor/1.0 by OkCommunication9478'),
            check_for_async=False  # Disable async environment check as recommended for FastAPI
        )
        
        # T-Mobile focused subreddits only
        self.target_subreddits = [
            'tmobile',
            'Sprint',  # T-Mobile acquired Sprint
            'MetroPCS',
            'mintmobile',  # T-Mobile MVNO
            # 'cellphones',  # General but catches T-Mobile discussions
            # 'NoContract'   # Many T-Mobile customers use prepaid
        ]
        
        # Cache settings (for demo purposes)
        self.cache_duration_hours = 24  # Cache data for 24 hours
        self.cache_dir = Path(__file__).parent.parent  # backend directory
        self.negative_cache_file = self.cache_dir / 'reddit_negative_cache.json'
        self.positive_cache_file = self.cache_dir / 'reddit_positive_cache.json'
        
        # Keywords that indicate negative sentiment (expanded from outage-specific)
        self.negative_keywords = {
            'service_issues': [
                'outage', 'outages', 'down', 'service down', 'network down',
                'not working', 'connection issues', 'connectivity issues',
                'service interruption', 'network issues', 'signal issues',
                'no service', 'no signal', 'dropped calls', 'slow data',
                'can\'t connect', 'cannot connect', 'connection problems',
                'network problems', 'service problems', 'technical difficulties',
                'maintenance', 'emergency maintenance'
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
            ],
            'location_indicators': [
                'area', 'region', 'city', 'state', 'nationwide', 'widespread',
                'multiple locations', 'everywhere', 'all over'
            ]
        }
        
        # T-Mobile specific keywords
        self.tmobile_keywords = [
            't-mobile', 'tmobile', 't mobile', 'magenta', 'uncarrier',
            'sprint', 'metro', 'metro by t-mobile', 'mint mobile'
        ]
        
        # Positive sentiment keywords for Customer Happiness Index
        self.positive_keywords = {
            'excellent_service': [
                'excellent service', 'amazing service', 'great service', 'outstanding service',
                'perfect service', 'fantastic service', 'superb service', 'wonderful service'
            ],
            'speed_praise': [
                'fast internet', 'blazing fast', 'super fast', 'lightning fast', 'incredible speed',
                'amazing speed', 'excellent speed', 'great speeds', 'fastest network'
            ],
            'coverage_praise': [
                'great coverage', 'excellent coverage', 'amazing coverage', 'perfect coverage',
                'strong signal', 'full bars', 'excellent signal', 'great reception'
            ],
            'customer_service': [
                'helpful staff', 'amazing support', 'great customer service', 'friendly staff',
                'excellent help', 'wonderful support', 'best customer service'
            ],
            'general_positive': [
                'love tmobile', 'love t-mobile', 'best carrier', 'highly recommend',
                'so happy', 'very satisfied', 'extremely happy', 'couldn\'t be happier',
                'impressed', 'exceeded expectations', 'blown away', 'fantastic experience'
            ],
            'feature_praise': [
                'unlimited data', 'no throttling', 'great deals', 'awesome plans',
                'free netflix', 'tuesday deals', 'magenta max', 'uncarrier benefits'
            ]
        }

    def is_negative_sentiment(self, text: str) -> tuple[bool, List[str], float]:
        """
        Check if text contains negative sentiment keywords
        Returns: (is_negative, keywords_found, confidence_score)
        """
        text_lower = text.lower()
        keywords_found = []
        confidence_score = 0.0
        
        # Check for different categories of negative sentiment with different weights
        for category, keywords in self.negative_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    keywords_found.append(keyword)
                    # Weight different categories
                    if category in ['service_issues', 'quality_complaints']:
                        confidence_score += 2.5  # Highest weight for service/quality issues
                    elif category in ['customer_service_issues', 'billing_issues']:
                        confidence_score += 2.0  # High weight for customer service/billing
                    elif category == 'general_negative':
                        confidence_score += 1.5  # Moderate weight for general negative
                    elif category == 'location_indicators':
                        confidence_score += 0.5  # Bonus points for location context
        
        # Normalize confidence score
        confidence_score = min(confidence_score / 8.0, 1.0)
        
        return len(keywords_found) > 0, keywords_found, confidence_score

    def is_tmobile_related(self, text: str) -> bool:
        """Check if text is related to T-Mobile"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.tmobile_keywords)

    def is_positive_sentiment(self, text: str) -> tuple[bool, List[str], float]:
        """
        Check if text contains positive sentiment keywords for Customer Happiness Index
        Returns: (is_positive, keywords_found, happiness_score)
        """
        text_lower = text.lower()
        keywords_found = []
        happiness_score = 0.0
        
        # Check for different categories of positive sentiment
        for category, keywords in self.positive_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    keywords_found.append(keyword)
                    # Different categories have different weights
                    if category in ['excellent_service', 'customer_service']:
                        happiness_score += 3.0  # Highest weight for service quality
                    elif category in ['speed_praise', 'coverage_praise']:
                        happiness_score += 2.5  # High weight for network quality
                    elif category in ['feature_praise']:
                        happiness_score += 2.0  # Good weight for features
                    else:  # general_positive
                        happiness_score += 1.5  # Lower but still significant
        
        # Normalize happiness score (0-1 range)
        happiness_score = min(happiness_score / 10.0, 1.0)
        
        return len(keywords_found) > 0, keywords_found, happiness_score

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

    def fetch_recent_posts(self, subreddit_name: str, limit: int = 50, time_filter: str = 'day') -> List[Dict[str, Any]]:
        """
        Fetch recent posts from a subreddit
        time_filter: 'hour', 'day', 'week', 'month', 'year', 'all'
        """
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            posts = []
            
            # Get hot posts
            for submission in subreddit.hot(limit=limit):
                # Skip stickied posts
                if submission.stickied:
                    continue
                    
                post_data = {
                    'title': submission.title,
                    'content': submission.selftext,
                    'author': str(submission.author) if submission.author else '[deleted]',
                    'created_utc': datetime.fromtimestamp(submission.created_utc),
                    'score': submission.score,
                    'num_comments': submission.num_comments,
                    'url': f"https://reddit.com{submission.permalink}",
                    'subreddit': subreddit_name,
                    'post_id': submission.id
                }
                posts.append(post_data)
            
            return posts
            
        except Exception as e:
            print(f"Error fetching posts from r/{subreddit_name}: {str(e)}")
            return []

    def analyze_posts_for_negative_sentiment(self, posts: List[Dict[str, Any]]) -> List[NegativePost]:
        """Analyze posts for negative sentiment indicators"""
        negative_posts = []
        
        for post in posts:
            # Combine title and content for analysis
            full_text = f"{post['title']} {post['content']}"
            
            # Check if it's negative sentiment
            is_negative, keywords_found, confidence = self.is_negative_sentiment(full_text)
            
            if is_negative:
                # Check if it's T-Mobile related (higher priority)
                is_tmobile = self.is_tmobile_related(full_text)
                
                # Boost confidence for T-Mobile posts
                if is_tmobile:
                    confidence = min(confidence * 1.5, 1.0)
                
                negative_post = NegativePost(
                    title=post['title'],
                    content=post['content'],
                    author=post['author'],
                    created_utc=post['created_utc'],
                    score=post['score'],
                    num_comments=post['num_comments'],
                    url=post['url'],
                    subreddit=post['subreddit'],
                    post_id=post['post_id'],
                    negative_keywords_found=keywords_found,
                    confidence_score=confidence
                )
                negative_posts.append(negative_post)
        
        # Sort by confidence score (highest first)
        negative_posts.sort(key=lambda x: x.confidence_score, reverse=True)
        return negative_posts

    def analyze_posts_for_happiness(self, posts: List[Dict[str, Any]]) -> List[HappinessPost]:
        """Analyze posts for positive sentiment indicators for Customer Happiness Index"""
        happiness_posts = []
        
        for post in posts:
            # Combine title and content for analysis
            full_text = f"{post['title']} {post['content']}"
            
            # Check if it's T-Mobile related first (required for happiness tracking)
            is_tmobile = self.is_tmobile_related(full_text)
            if not is_tmobile:
                continue  # Skip non T-Mobile posts for happiness index
            
            # Check for positive sentiment
            is_positive, keywords_found, happiness_score = self.is_positive_sentiment(full_text)
            
            if is_positive and happiness_score > 0.3:  # Minimum threshold for happiness
                # Determine primary category of positive feedback
                category = self._determine_happiness_category(keywords_found)
                
                happiness_post = HappinessPost(
                    title=post['title'],
                    content=post['content'],
                    author=post['author'],
                    created_utc=post['created_utc'],
                    score=post['score'],
                    num_comments=post['num_comments'],
                    url=post['url'],
                    subreddit=post['subreddit'],
                    post_id=post['post_id'],
                    positive_keywords_found=keywords_found,
                    happiness_score=happiness_score,
                    category=category
                )
                happiness_posts.append(happiness_post)
        
        # Sort by happiness score (highest first)
        happiness_posts.sort(key=lambda x: x.happiness_score, reverse=True)
        return happiness_posts

    def _determine_happiness_category(self, keywords_found: List[str]) -> str:
        """Determine the primary category of positive feedback"""
        category_counts = {
            'service': 0, 'speed': 0, 'coverage': 0, 
            'customer_service': 0, 'features': 0, 'general': 0
        }
        
        for keyword in keywords_found:
            if keyword in self.positive_keywords['excellent_service']:
                category_counts['service'] += 1
            elif keyword in self.positive_keywords['speed_praise']:
                category_counts['speed'] += 1
            elif keyword in self.positive_keywords['coverage_praise']:
                category_counts['coverage'] += 1
            elif keyword in self.positive_keywords['customer_service']:
                category_counts['customer_service'] += 1
            elif keyword in self.positive_keywords['feature_praise']:
                category_counts['features'] += 1
            else:
                category_counts['general'] += 1
        
        # Return category with highest count
        return max(category_counts, key=category_counts.get)

    def scan_all_subreddits(self, limit_per_subreddit: int = 50) -> List[NegativePost]:
        """Scan all target subreddits for negative sentiment posts"""
        all_negative_posts = []
        
        print(f"Scanning {len(self.target_subreddits)} subreddits for negative sentiment posts...")
        
        for subreddit in self.target_subreddits:
            print(f"Scanning r/{subreddit}...")
            posts = self.fetch_recent_posts(subreddit, limit=limit_per_subreddit)
            
            if posts:
                negative_posts = self.analyze_posts_for_negative_sentiment(posts)
                all_negative_posts.extend(negative_posts)
                print(f"Found {len(negative_posts)} negative sentiment posts in r/{subreddit}")
            else:
                print(f"No posts found in r/{subreddit}")
        
        # Remove duplicates and sort by confidence
        unique_posts = {}
        for post in all_negative_posts:
            if post.post_id not in unique_posts:
                unique_posts[post.post_id] = post
            elif post.confidence_score > unique_posts[post.post_id].confidence_score:
                unique_posts[post.post_id] = post
        
        final_posts = list(unique_posts.values())
        final_posts.sort(key=lambda x: x.confidence_score, reverse=True)
        
        return final_posts

    def save_results_to_json(self, negative_posts: List[NegativePost], filename: str = 'reddit_negative_data.json'):
        """Save the results to a JSON file"""
        data = {
            'timestamp': datetime.now().isoformat(),
            'total_posts_found': len(negative_posts),
            'posts': []
        }
        
        for post in negative_posts:
            post_dict = {
                'title': post.title,
                'content': post.content[:500] + '...' if len(post.content) > 500 else post.content,
                'author': post.author,
                'created_utc': post.created_utc.isoformat(),
                'score': post.score,
                'num_comments': post.num_comments,
                'url': post.url,
                'subreddit': post.subreddit,
                'post_id': post.post_id,
                'negative_keywords_found': post.negative_keywords_found,
                'confidence_score': round(post.confidence_score, 3)
            }
            data['posts'].append(post_dict)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Results saved to {filename}")

    # API-friendly functions for the FastAPI routes
    def scan_for_outages_api(self, limit_per_subreddit: int = 30, use_cache: bool = True) -> Dict[str, Any]:
        """API-friendly function to scan for T-Mobile outages (backward compatibility)"""
        # For backward compatibility, redirect to negative sentiment analysis
        return self.scan_for_negative_sentiment_api(limit_per_subreddit, use_cache)
    
    def scan_for_negative_sentiment_api(self, limit_per_subreddit: int = 30, use_cache: bool = True) -> Dict[str, Any]:
        """
        API-friendly function to scan for T-Mobile negative sentiment
        
        Args:
            limit_per_subreddit: Number of posts to fetch per subreddit
            use_cache: If True, use cached data if available (recommended for demos)
        """
        # Check cache first if enabled
        if use_cache and self.is_cache_valid(self.negative_cache_file):
            print("📦 Using cached Reddit negative sentiment data")
            cached_data = self.load_from_cache(self.negative_cache_file)
            if cached_data:
                cached_data['from_cache'] = True
                return cached_data
        
        try:
            print("🔍 Fetching fresh Reddit negative sentiment data...")
            negative_posts = []
            
            for subreddit in self.target_subreddits:
                posts = self.fetch_recent_posts(subreddit, limit=limit_per_subreddit)
                if posts:
                    subreddit_negatives = self.analyze_posts_for_negative_sentiment(posts)
                    # Filter to only T-Mobile related negative posts
                    tmobile_negatives = [
                        post for post in subreddit_negatives 
                        if self.is_tmobile_related(f"{post.title} {post.content}")
                    ]
                    negative_posts.extend(tmobile_negatives)
            
            # Remove duplicates and sort
            unique_posts = {post.post_id: post for post in negative_posts}
            final_posts = sorted(unique_posts.values(), key=lambda x: x.confidence_score, reverse=True)
            
            # Convert to API response format
            result = {
                'success': True,
                'timestamp': datetime.now().isoformat(),
                'total_negative_posts': len(final_posts),
                'from_cache': False,
                'negative_posts': [
                    {
                        'id': post.post_id,
                        'title': post.title,
                        'content': post.content[:300] + '...' if len(post.content) > 300 else post.content,
                        'author': post.author,
                        'created_utc': post.created_utc.isoformat(),
                        'score': post.score,
                        'num_comments': post.num_comments,
                        'url': post.url,
                        'subreddit': post.subreddit,
                        'confidence_score': round(post.confidence_score, 3),
                        'keywords_found': post.negative_keywords_found
                    }
                    for post in final_posts[:20]  # Limit to top 20 for API response
                ]
            }
            
            # Save to cache
            self.save_to_cache(self.negative_cache_file, result)
            
            return result
        except Exception as e:
            # Try to return stale cache on error
            if self.negative_cache_file.exists():
                print(f"⚠️  Error occurred, attempting to use stale cache: {e}")
                cached_data = self.load_from_cache(self.negative_cache_file)
                if cached_data:
                    cached_data['from_cache'] = True
                    cached_data['cache_stale'] = True
                    return cached_data
            
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'total_negative_posts': 0,
                'from_cache': False,
                'negative_posts': []
            }

    def scan_for_happiness_api(self, limit_per_subreddit: int = 30, use_cache: bool = True) -> Dict[str, Any]:
        """
        API-friendly function to scan for positive T-Mobile sentiment
        
        Args:
            limit_per_subreddit: Number of posts to fetch per subreddit
            use_cache: If True, use cached data if available (recommended for demos)
        """
        # Check cache first if enabled
        if use_cache and self.is_cache_valid(self.positive_cache_file):
            print("📦 Using cached Reddit positive sentiment data")
            cached_data = self.load_from_cache(self.positive_cache_file)
            if cached_data:
                cached_data['from_cache'] = True
                return cached_data
        
        try:
            print("🔍 Fetching fresh Reddit positive sentiment data...")
            happiness_posts = []
            
            for subreddit in self.target_subreddits:
                posts = self.fetch_recent_posts(subreddit, limit=limit_per_subreddit)
                if posts:
                    subreddit_happiness = self.analyze_posts_for_happiness(posts)
                    happiness_posts.extend(subreddit_happiness)
            
            # Remove duplicates and sort
            unique_posts = {post.post_id: post for post in happiness_posts}
            final_posts = sorted(unique_posts.values(), key=lambda x: x.happiness_score, reverse=True)
            
            # Calculate happiness metrics
            category_breakdown = {}
            for post in final_posts:
                category_breakdown[post.category] = category_breakdown.get(post.category, 0) + 1
            
            avg_happiness = sum(post.happiness_score for post in final_posts) / len(final_posts) if final_posts else 0
            
            result = {
                'success': True,
                'timestamp': datetime.now().isoformat(),
                'total_positive_posts': len(final_posts),
                'average_happiness_score': round(avg_happiness, 3),
                'category_breakdown': category_breakdown,
                'from_cache': False,
                'happiness_posts': [
                    {
                        'id': post.post_id,
                        'title': post.title,
                        'content': post.content[:300] + '...' if len(post.content) > 300 else post.content,
                        'author': post.author,
                        'created_utc': post.created_utc.isoformat(),
                        'score': post.score,
                        'num_comments': post.num_comments,
                        'url': post.url,
                        'subreddit': post.subreddit,
                        'happiness_score': round(post.happiness_score, 3),
                        'category': post.category,
                        'keywords_found': post.positive_keywords_found
                    }
                    for post in final_posts[:20]  # Limit to top 20 for API response
                ]
            }
            
            # Save to cache
            self.save_to_cache(self.positive_cache_file, result)
            
            return result
        except Exception as e:
            # Try to return stale cache on error
            if self.positive_cache_file.exists():
                print(f"⚠️  Error occurred, attempting to use stale cache: {e}")
                cached_data = self.load_from_cache(self.positive_cache_file)
                if cached_data:
                    cached_data['from_cache'] = True
                    cached_data['cache_stale'] = True
                    return cached_data
            
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'total_positive_posts': 0,
                'average_happiness_score': 0,
                'category_breakdown': {},
                'from_cache': False,
                'happiness_posts': []
            }

    def print_summary(self, negative_posts: List[NegativePost]):
        """Print a summary of found negative sentiment posts"""
        if not negative_posts:
            print("No negative sentiment posts found.")
            return
        
        print(f"\n{'='*50}")
        print(f"NEGATIVE SENTIMENT MONITORING SUMMARY")
        print(f"{'='*50}")
        print(f"Total negative sentiment posts found: {len(negative_posts)}")
        
        # Group by subreddit
        subreddit_counts = {}
        for post in negative_posts:
            subreddit_counts[post.subreddit] = subreddit_counts.get(post.subreddit, 0) + 1
        
        print("\nPosts by subreddit:")
        for subreddit, count in sorted(subreddit_counts.items()):
            print(f"  r/{subreddit}: {count}")
        
        print(f"\nTop 5 highest confidence posts:")
        for i, post in enumerate(negative_posts[:5], 1):
            print(f"\n{i}. [{post.confidence_score:.2f}] r/{post.subreddit}")
            print(f"   Title: {post.title}")
            print(f"   Author: {post.author} | Score: {post.score} | Comments: {post.num_comments}")
            print(f"   Keywords: {', '.join(post.negative_keywords_found)}")
            print(f"   URL: {post.url}")

def main():
    """Main function to run the Reddit sentiment monitor"""
    # Set up environment variables for Reddit API
    # You need to create a Reddit app at https://www.reddit.com/prefs/apps
    # and set these environment variables:
    # export REDDIT_CLIENT_ID="your_client_id"
    # export REDDIT_CLIENT_SECRET="your_client_secret" 
    # export REDDIT_USER_AGENT="sentiment_monitor/1.0 by your_username"
    
    monitor = RedditSentimentMonitor()
    
    try:
        # Scan all subreddits for negative sentiment posts
        negative_posts = monitor.scan_all_subreddits(limit_per_subreddit=100)
        
        # Print summary
        monitor.print_summary(negative_posts)
        
        # Save results to JSON
        monitor.save_results_to_json(negative_posts, 'latest_reddit_negative_data.json')
        
        return negative_posts
        
    except Exception as e:
        print(f"Error running sentiment monitor: {str(e)}")
        return []

if __name__ == "__main__":
    main()
