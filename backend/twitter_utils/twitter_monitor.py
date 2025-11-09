import tweepy
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class TwitterPost:
    """Data class to represent a Twitter/X post"""
    post_id: str
    text: str
    author_username: str
    author_name: str
    created_at: datetime
    likes: int
    retweets: int
    replies: int
    url: str
    sentiment_type: str  # 'negative', 'positive', or 'neutral'
    keywords_found: List[str]
    confidence_score: float

class TwitterSentimentMonitor:
    def __init__(self):
        """Initialize Twitter/X API client"""
        # Twitter API v2 credentials
        self.bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        if not self.bearer_token:
            raise ValueError("TWITTER_BEARER_TOKEN environment variable is not set")
        
        # Initialize Twitter API client
        self.client = tweepy.Client(bearer_token=self.bearer_token, wait_on_rate_limit=False)
        
        # Cache settings
        self.cache_dir = Path(__file__).parent.parent
        self.negative_cache_file = self.cache_dir / 'twitter_negative_cache.json'
        self.positive_cache_file = self.cache_dir / 'twitter_positive_cache.json'
        self.cache_duration_hours = 24  # Cache data for 24 hours
        
        # Search query for T-Mobile
        self.search_query = '(tmobile OR "t-mobile" OR "T-Mobile") -is:retweet lang:en'
        
        # Negative sentiment keywords (same as Reddit)
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
                'wrong bill', 'billing issues', 'can\'t pay bill', 'account suspended'
            ],
            'general_negative': [
                'hate tmobile', 'hate t-mobile', 'worst carrier', 'switching carriers',
                'leaving tmobile', 'cancel service', 'disappointed', 'frustrated',
                'angry', 'furious', 'fed up', 'never again', 'regret'
            ]
        }
        
        # Positive sentiment keywords (same as Reddit)
        self.positive_keywords = {
            'excellent_service': [
                'excellent service', 'amazing service', 'great service', 'outstanding service',
                'perfect service', 'fantastic service', 'superb service', 'wonderful service'
            ],
            'speed_praise': [
                'fast internet', 'blazing fast', 'super fast', 'lightning fast', 'incredible speed',
                'amazing speed', 'excellent speed', 'great speeds', 'fastest network', '5g is amazing'
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
                'impressed', 'exceeded expectations', 'blown away', 'fantastic experience',
                'thank you tmobile', 'thank you t-mobile'
            ],
            'feature_praise': [
                'unlimited data', 'no throttling', 'great deals', 'awesome plans',
                'free netflix', 'tuesday deals', 'magenta max', 'uncarrier benefits',
                'amazing perks', 'great value'
            ]
        }

    def is_cache_valid(self, cache_file: Path) -> bool:
        """Check if cache file exists and is still valid"""
        if not cache_file.exists():
            return False
        
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            cache_timestamp = datetime.fromisoformat(data.get('cached_at', '2000-01-01'))
            age_hours = (datetime.now() - cache_timestamp).total_seconds() / 3600
            
            return age_hours < self.cache_duration_hours
        except Exception as e:
            print(f"Error reading cache: {e}")
            return False

    def load_from_cache(self, cache_file: Path) -> Optional[Dict[str, Any]]:
        """Load data from cache file"""
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"Loaded data from cache: {cache_file}")
            return data
        except Exception as e:
            print(f"Error loading cache: {e}")
            return None

    def save_to_cache(self, data: Dict[str, Any], cache_file: Path):
        """Save data to cache file"""
        try:
            data['cached_at'] = datetime.now().isoformat()
            data['cache_expires_at'] = (datetime.now() + timedelta(hours=self.cache_duration_hours)).isoformat()
            
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"Saved data to cache: {cache_file}")
        except Exception as e:
            print(f"Error saving cache: {e}")

    def is_negative_sentiment(self, text: str) -> tuple[bool, List[str], float]:
        """
        Check if text contains negative sentiment keywords
        Returns: (is_negative, keywords_found, confidence_score)
        """
        text_lower = text.lower()
        keywords_found = []
        confidence_score = 0.0
        
        for category, keywords in self.negative_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    keywords_found.append(keyword)
                    if category in ['service_issues', 'quality_complaints']:
                        confidence_score += 2.5
                    elif category in ['customer_service_issues', 'billing_issues']:
                        confidence_score += 2.0
                    else:
                        confidence_score += 1.5
        
        confidence_score = min(confidence_score / 8.0, 1.0)
        return len(keywords_found) > 0, keywords_found, confidence_score

    def is_positive_sentiment(self, text: str) -> tuple[bool, List[str], float]:
        """
        Check if text contains positive sentiment keywords
        Returns: (is_positive, keywords_found, happiness_score)
        """
        text_lower = text.lower()
        keywords_found = []
        happiness_score = 0.0
        
        for category, keywords in self.positive_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    keywords_found.append(keyword)
                    if category in ['excellent_service', 'customer_service']:
                        happiness_score += 3.0
                    elif category in ['speed_praise', 'coverage_praise']:
                        happiness_score += 2.5
                    elif category in ['feature_praise']:
                        happiness_score += 2.0
                    else:
                        happiness_score += 1.5
        
        happiness_score = min(happiness_score / 10.0, 1.0)
        return len(keywords_found) > 0, keywords_found, happiness_score

    def search_tweets(self, max_results: int = 100) -> List[TwitterPost]:
        """Search for tweets about T-Mobile"""
        try:
            # Search recent tweets (last 7 days for free tier)
            tweets = self.client.search_recent_tweets(
                query=self.search_query,
                max_results=max_results,
                tweet_fields=['created_at', 'public_metrics', 'author_id'],
                user_fields=['username', 'name'],
                expansions=['author_id']
            )
            
            if not tweets.data:
                return []
            
            # Create a map of user IDs to user info
            users = {user.id: user for user in tweets.includes.get('users', [])}
            
            posts = []
            for tweet in tweets.data:
                author = users.get(tweet.author_id)
                
                # Analyze sentiment
                is_negative, neg_keywords, neg_confidence = self.is_negative_sentiment(tweet.text)
                is_positive, pos_keywords, pos_confidence = self.is_positive_sentiment(tweet.text)
                
                # Determine primary sentiment
                if is_negative and neg_confidence > 0.3:
                    sentiment_type = 'negative'
                    keywords_found = neg_keywords
                    confidence_score = neg_confidence
                elif is_positive and pos_confidence > 0.3:
                    sentiment_type = 'positive'
                    keywords_found = pos_keywords
                    confidence_score = pos_confidence
                else:
                    continue  # Skip neutral posts
                
                metrics = tweet.public_metrics
                
                post = TwitterPost(
                    post_id=tweet.id,
                    text=tweet.text,
                    author_username=author.username if author else 'unknown',
                    author_name=author.name if author else 'Unknown',
                    created_at=tweet.created_at,
                    likes=metrics.get('like_count', 0),
                    retweets=metrics.get('retweet_count', 0),
                    replies=metrics.get('reply_count', 0),
                    url=f"https://twitter.com/{author.username if author else 'twitter'}/status/{tweet.id}",
                    sentiment_type=sentiment_type,
                    keywords_found=keywords_found,
                    confidence_score=confidence_score
                )
                posts.append(post)
            
            return posts
            
        except Exception as e:
            print(f"Error searching tweets: {e}")
            return []

    def get_negative_posts_api(self, max_results: int = 100, use_cache: bool = True) -> Dict[str, Any]:
        """API-friendly function to get negative sentiment tweets with caching"""
        # Check cache first
        if use_cache and self.is_cache_valid(self.negative_cache_file):
            cached_data = self.load_from_cache(self.negative_cache_file)
            if cached_data:
                cached_data['from_cache'] = True
                return cached_data
        
        try:
            # Fetch fresh data from Twitter API
            print(f"Fetching fresh data from Twitter API (using API quota)")
            all_posts = self.search_tweets(max_results=max_results)
            
            # Filter negative posts
            negative_posts = [p for p in all_posts if p.sentiment_type == 'negative']
            negative_posts.sort(key=lambda x: x.confidence_score, reverse=True)
            
            result = {
                'success': True,
                'timestamp': datetime.now().isoformat(),
                'total_negative_posts': len(negative_posts),
                'from_cache': False,
                'negative_posts': [
                    {
                        'id': post.post_id,
                        'text': post.text,
                        'author_username': post.author_username,
                        'author_name': post.author_name,
                        'created_at': post.created_at.isoformat(),
                        'likes': post.likes,
                        'retweets': post.retweets,
                        'replies': post.replies,
                        'url': post.url,
                        'confidence_score': round(post.confidence_score, 3),
                        'keywords_found': post.keywords_found
                    }
                    for post in negative_posts[:20]  # Limit to top 20
                ]
            }
            
            # Save to cache
            self.save_to_cache(result, self.negative_cache_file)
            
            return result
            
        except Exception as e:
            # If API fails, try to return stale cache
            if self.negative_cache_file.exists():
                print(f"API failed, returning stale cache: {e}")
                cached_data = self.load_from_cache(self.negative_cache_file)
                if cached_data:
                    cached_data['from_cache'] = True
                    cached_data['cache_stale'] = True
                    cached_data['note'] = 'Using stale cache due to API error'
                    return cached_data
            
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'total_negative_posts': 0,
                'negative_posts': []
            }

    def get_positive_posts_api(self, max_results: int = 100, use_cache: bool = True) -> Dict[str, Any]:
        """API-friendly function to get positive sentiment tweets with caching"""
        # Check cache first
        if use_cache and self.is_cache_valid(self.positive_cache_file):
            cached_data = self.load_from_cache(self.positive_cache_file)
            if cached_data:
                cached_data['from_cache'] = True
                return cached_data
        
        try:
            # Fetch fresh data from Twitter API
            print(f"Fetching fresh data from Twitter API (using API quota)")
            all_posts = self.search_tweets(max_results=max_results)
            
            # Filter positive posts
            positive_posts = [p for p in all_posts if p.sentiment_type == 'positive']
            positive_posts.sort(key=lambda x: x.confidence_score, reverse=True)
            
            avg_happiness = sum(p.confidence_score for p in positive_posts) / len(positive_posts) if positive_posts else 0
            
            result = {
                'success': True,
                'timestamp': datetime.now().isoformat(),
                'total_positive_posts': len(positive_posts),
                'average_happiness_score': round(avg_happiness, 3),
                'from_cache': False,
                'happiness_posts': [
                    {
                        'id': post.post_id,
                        'text': post.text,
                        'author_username': post.author_username,
                        'author_name': post.author_name,
                        'created_at': post.created_at.isoformat(),
                        'likes': post.likes,
                        'retweets': post.retweets,
                        'replies': post.replies,
                        'url': post.url,
                        'happiness_score': round(post.confidence_score, 3),
                        'keywords_found': post.keywords_found
                    }
                    for post in positive_posts[:20]  # Limit to top 20
                ]
            }
            
            # Save to cache
            self.save_to_cache(result, self.positive_cache_file)
            
            return result
            
        except Exception as e:
            # If API fails, try to return stale cache
            if self.positive_cache_file.exists():
                print(f"API failed, returning stale cache: {e}")
                cached_data = self.load_from_cache(self.positive_cache_file)
                if cached_data:
                    cached_data['from_cache'] = True
                    cached_data['cache_stale'] = True
                    cached_data['note'] = 'Using stale cache due to API error'
                    return cached_data
            
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'total_positive_posts': 0,
                'average_happiness_score': 0,
                'happiness_posts': []
            }

def main():
    """Main function to test Twitter monitoring"""
    monitor = TwitterSentimentMonitor()
    
    try:
        # Test negative sentiment
        print("Fetching negative sentiment tweets...")
        negative_result = monitor.get_negative_posts_api(max_results=100, use_cache=False)
        
        print("\n" + "="*50)
        print("TWITTER T-MOBILE NEGATIVE SENTIMENT")
        print("="*50)
        print(f"Total negative posts: {negative_result.get('total_negative_posts', 0)}")
        print(f"From cache: {negative_result.get('from_cache', False)}")
        
        if negative_result.get('negative_posts'):
            print("\nTop 3 Negative Posts:")
            for i, post in enumerate(negative_result['negative_posts'][:3], 1):
                print(f"{i}. [{post['confidence_score']:.2f}] @{post['author_username']}")
                print(f"   {post['text'][:100]}...")
                print(f"   {post['likes']} likes, {post['retweets']} retweets")
        
        # Test positive sentiment
        print("\n\nFetching positive sentiment tweets...")
        positive_result = monitor.get_positive_posts_api(max_results=100, use_cache=False)
        
        print("\n" + "="*50)
        print("TWITTER T-MOBILE POSITIVE SENTIMENT")
        print("="*50)
        print(f"Total positive posts: {positive_result.get('total_positive_posts', 0)}")
        print(f"Average happiness: {positive_result.get('average_happiness_score', 0):.3f}")
        print(f"From cache: {positive_result.get('from_cache', False)}")
        
        if positive_result.get('happiness_posts'):
            print("\nTop 3 Positive Posts:")
            for i, post in enumerate(positive_result['happiness_posts'][:3], 1):
                print(f"{i}. [{post['happiness_score']:.2f}] @{post['author_username']}")
                print(f"   {post['text'][:100]}...")
                print(f"   {post['likes']} likes, {post['retweets']} retweets")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

