import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass
class FacebookPost:
    """Data class to represent a Facebook post"""
    post_id: str
    message: str
    created_time: datetime
    page_name: str
    page_id: str
    likes: int
    comments: int
    shares: int
    post_url: str
    sentiment_type: str  # 'outage', 'positive', or 'neutral'
    keywords_found: List[str]
    confidence_score: float

class FacebookSentimentMonitor:
    def __init__(self):
        """Initialize Facebook Graph API client"""
        # Facebook API credentials
        self.access_token = os.getenv('FACEBOOK_ACCESS_TOKEN')
        if not self.access_token:
            raise ValueError("FACEBOOK_ACCESS_TOKEN environment variable is not set")
        self.base_url = 'https://graph.facebook.com/v18.0'
        
        # Search keywords for T-Mobile user posts
        self.search_keywords = [
            'tmobile', 't-mobile', 'T-Mobile', 'TMobile',
            'metro by tmobile', 'sprint tmobile'
        ]
        
        # Outage-related keywords (same as Reddit)
        self.outage_keywords = {
            'primary': [
                'outage', 'outages', 'down', 'service down', 'network down',
                'not working', 'connection issues', 'connectivity issues',
                'service interruption', 'network issues', 'signal issues',
                'no service', 'no signal'
            ],
            'secondary': [
                'dropped calls', 'slow data', 'can\'t connect', 'cannot connect',
                'connection problems', 'network problems', 'service problems',
                'technical difficulties', 'maintenance', 'emergency maintenance'
            ],
            'location_indicators': [
                'area', 'region', 'city', 'state', 'nationwide', 'widespread',
                'multiple locations', 'everywhere', 'all over'
            ]
        }
        
        # Positive sentiment keywords for Customer Happiness Index
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

    def _make_api_request(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make a request to Facebook Graph API"""
        if params is None:
            params = {}
        
        params['access_token'] = self.access_token
        
        try:
            response = requests.get(f"{self.base_url}/{endpoint}", params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Facebook API request failed: {str(e)}")
            return {'error': str(e)}

    def is_outage_related(self, text: str) -> tuple[bool, List[str], float]:
        """
        Check if text contains outage-related keywords
        Returns: (is_outage, keywords_found, confidence_score)
        """
        if not text:
            return False, [], 0.0
            
        text_lower = text.lower()
        keywords_found = []
        confidence_score = 0.0
        
        # Check for primary outage keywords (higher weight)
        for keyword in self.outage_keywords['primary']:
            if keyword in text_lower:
                keywords_found.append(keyword)
                confidence_score += 2.0
        
        # Check for secondary outage keywords (lower weight)
        for keyword in self.outage_keywords['secondary']:
            if keyword in text_lower:
                keywords_found.append(keyword)
                confidence_score += 1.0
        
        # Check for location indicators (bonus points)
        for keyword in self.outage_keywords['location_indicators']:
            if keyword in text_lower:
                keywords_found.append(keyword)
                confidence_score += 0.5
        
        # Normalize confidence score
        confidence_score = min(confidence_score / 5.0, 1.0)
        
        return len(keywords_found) > 0, keywords_found, confidence_score

    def is_positive_sentiment(self, text: str) -> tuple[bool, List[str], float]:
        """
        Check if text contains positive sentiment keywords
        Returns: (is_positive, keywords_found, happiness_score)
        """
        if not text:
            return False, [], 0.0
            
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

    def search_public_posts(self, keyword: str, limit: int = 25) -> List[Dict[str, Any]]:
        """Search for public posts containing a keyword"""
        params = {
            'q': keyword,
            'type': 'post',
            'fields': 'id,message,created_time,from,likes.summary(true),comments.summary(true),shares,permalink_url',
            'limit': limit
        }
        
        response = self._make_api_request('search', params)
        
        if 'error' in response:
            print(f"Error searching posts for '{keyword}': {response['error']}")
            return []
        
        return response.get('data', [])

    def analyze_post_sentiment(self, post: Dict[str, Any]) -> Optional[FacebookPost]:
        """Analyze a single Facebook post for sentiment"""
        message = post.get('message', '')
        if not message:
            return None  # Skip posts without text content
        
        # Check for outage sentiment
        is_outage, outage_keywords, outage_confidence = self.is_outage_related(message)
        
        # Check for positive sentiment
        is_positive, positive_keywords, happiness_score = self.is_positive_sentiment(message)
        
        # Determine primary sentiment type and score
        if is_outage and outage_confidence > 0.3:
            sentiment_type = 'outage'
            keywords_found = outage_keywords
            confidence_score = outage_confidence
        elif is_positive and happiness_score > 0.3:
            sentiment_type = 'positive'
            keywords_found = positive_keywords
            confidence_score = happiness_score
        else:
            return None  # Not relevant enough
        
        # Extract engagement metrics
        likes = post.get('likes', {}).get('summary', {}).get('total_count', 0)
        comments = post.get('comments', {}).get('summary', {}).get('total_count', 0)
        shares = post.get('shares', {}).get('count', 0)
        
        # Get user info
        from_info = post.get('from', {})
        page_name = from_info.get('name', 'Unknown User')
        page_id = from_info.get('id', '')
        
        # Create post URL
        post_url = post.get('permalink_url', f"https://facebook.com/{post['id']}")
        
        # Parse creation time
        created_time = datetime.fromisoformat(post['created_time'].replace('Z', '+00:00'))
        
        return FacebookPost(
            post_id=post['id'],
            message=message,
            created_time=created_time,
            page_name=page_name,
            page_id=page_id,
            likes=likes,
            comments=comments,
            shares=shares,
            post_url=post_url,
            sentiment_type=sentiment_type,
            keywords_found=keywords_found,
            confidence_score=confidence_score
        )

    def search_user_posts_api(self, limit_per_keyword: int = 25) -> Dict[str, Any]:
        """API-friendly function to search public user posts about T-Mobile"""
        try:
            all_posts = []
            outage_posts = []
            positive_posts = []
            
            # Search for posts using T-Mobile keywords
            for keyword in self.search_keywords:
                print(f"Searching Facebook for posts containing: {keyword}")
                
                # Get posts matching this keyword
                posts = self.search_public_posts(keyword, limit=limit_per_keyword)
                
                for post in posts:
                    analyzed_post = self.analyze_post_sentiment(post)
                    if analyzed_post:
                        # Check for duplicates
                        if not any(p.post_id == analyzed_post.post_id for p in all_posts):
                            all_posts.append(analyzed_post)
                            
                            if analyzed_post.sentiment_type == 'outage':
                                outage_posts.append(analyzed_post)
                            elif analyzed_post.sentiment_type == 'positive':
                                positive_posts.append(analyzed_post)
            
            # Sort posts by confidence/happiness scores
            outage_posts.sort(key=lambda x: x.confidence_score, reverse=True)
            positive_posts.sort(key=lambda x: x.confidence_score, reverse=True)
            
            return {
                'success': True,
                'timestamp': datetime.now().isoformat(),
                'total_posts_analyzed': len(all_posts),
                'outage_posts': [
                    {
                        'id': post.post_id,
                        'message': post.message[:300] + '...' if len(post.message) > 300 else post.message,
                        'created_time': post.created_time.isoformat(),
                        'author': post.page_name,
                        'likes': post.likes,
                        'comments': post.comments,
                        'shares': post.shares,
                        'url': post.post_url,
                        'confidence_score': round(post.confidence_score, 3),
                        'keywords_found': post.keywords_found
                    }
                    for post in outage_posts[:15]  # Limit to top 15
                ],
                'positive_posts': [
                    {
                        'id': post.post_id,
                        'message': post.message[:300] + '...' if len(post.message) > 300 else post.message,
                        'created_time': post.created_time.isoformat(),
                        'author': post.page_name,
                        'likes': post.likes,
                        'comments': post.comments,
                        'shares': post.shares,
                        'url': post.post_url,
                        'happiness_score': round(post.confidence_score, 3),
                        'keywords_found': post.keywords_found
                    }
                    for post in positive_posts[:15]  # Limit to top 15
                ]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'total_posts_analyzed': 0,
                'outage_posts': [],
                'positive_posts': []
            }

    def get_outages_api(self, limit_per_keyword: int = 25) -> Dict[str, Any]:
        """API-friendly function to get T-Mobile outage posts from user posts on Facebook"""
        try:
            result = self.search_user_posts_api(limit_per_keyword)
            
            if not result['success']:
                return result
            
            return {
                'success': True,
                'timestamp': result['timestamp'],
                'total_outage_posts': len(result['outage_posts']),
                'outages': result['outage_posts']
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'total_outage_posts': 0,
                'outages': []
            }

    def get_happiness_api(self, limit_per_keyword: int = 25) -> Dict[str, Any]:
        """API-friendly function to get T-Mobile positive sentiment from user posts on Facebook"""
        try:
            result = self.search_user_posts_api(limit_per_keyword)
            
            if not result['success']:
                return result
            
            # Calculate happiness metrics
            positive_posts = result['positive_posts']
            avg_happiness = sum(post['happiness_score'] for post in positive_posts) / len(positive_posts) if positive_posts else 0
            
            return {
                'success': True,
                'timestamp': result['timestamp'],
                'total_positive_posts': len(positive_posts),
                'average_happiness_score': round(avg_happiness, 3),
                'happiness_posts': positive_posts
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'total_positive_posts': 0,
                'average_happiness_score': 0,
                'happiness_posts': []
            }

def main():
    """Main function to test Facebook monitoring"""
    monitor = FacebookSentimentMonitor()
    
    try:
        # Test searching user posts
        result = monitor.search_user_posts_api(limit_per_keyword=10)
        
        print("\n" + "="*50)
        print("FACEBOOK T-MOBILE USER SENTIMENT MONITORING")
        print("="*50)
        
        if result['success']:
            print(f"Total posts analyzed: {result['total_posts_analyzed']}")
            print(f"Outage-related posts: {len(result['outage_posts'])}")
            print(f"Positive sentiment posts: {len(result['positive_posts'])}")
            
            # Show top outage posts
            if result['outage_posts']:
                print("\nTop Outage Posts from Users:")
                for i, post in enumerate(result['outage_posts'][:3], 1):
                    print(f"{i}. [{post['confidence_score']:.2f}] by {post['author']}")
                    print(f"   Message: {post['message'][:100]}...")
                    print(f"   Engagement: {post['likes']} likes, {post['comments']} comments")
            
            # Show top positive posts
            if result['positive_posts']:
                print("\nTop Positive Posts from Users:")
                for i, post in enumerate(result['positive_posts'][:3], 1):
                    print(f"{i}. [{post['happiness_score']:.2f}] by {post['author']}")
                    print(f"   Message: {post['message'][:100]}...")
                    print(f"   Engagement: {post['likes']} likes, {post['comments']} comments")
        else:
            print(f"Error: {result['error']}")
        
        return result
        
    except Exception as e:
        print(f"Error running Facebook monitor: {str(e)}")
        return {}

if __name__ == "__main__":
    main()
