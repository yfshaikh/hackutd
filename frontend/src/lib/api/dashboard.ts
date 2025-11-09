/**
 * Dashboard API - HTTP client functions for dashboard-related data
 */

const API_BASE_URL = 'http://localhost:8000';

// Types for API responses
export interface SentimentDataPoint {
  month: string;
  timestamp: string;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_posts: number;
  sentiment_ratio: number;
}

export interface HistoricalSentimentResponse {
  success: boolean;
  analysis_period: {
    start_date: string;
    end_date: string;
    months_analyzed: number;
  };
  overall_statistics: {
    total_posts_analyzed: number;
    total_positive: number;
    total_negative: number;
    overall_sentiment_ratio: number;
    sentiment_score: number;
  };
  monthly_data: SentimentDataPoint[];
  timestamp: string;
}

export interface RecentSentimentResponse {
  success: boolean;
  period_days: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_posts: number;
  sentiment_ratio: number;
  sentiment_score: number;
  timestamp: string;
  platforms_included?: string[];
  breakdown?: {
    reddit?: {
      positive: number;
      negative: number;
      neutral: number;
    };
    twitter?: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

export interface RedditOutageResponse {
  success: boolean;
  timestamp: string;
  total_negative_posts: number;
  negative_posts: Array<{
    id: string;
    title: string;
    content: string;
    author: string;
    created_utc: string;
    score: number;
    num_comments: number;
    url: string;
    subreddit: string;
    confidence_score: number;
    keywords_found: string[];
  }>;
}

export interface RedditHappinessResponse {
  success: boolean;
  timestamp: string;
  total_positive_posts: number;
  average_happiness_score: number;
  category_breakdown: Record<string, number>;
  happiness_posts: Array<{
    id: string;
    title: string;
    content: string;
    author: string;
    created_utc: string;
    score: number;
    num_comments: number;
    url: string;
    subreddit: string;
    happiness_score: number;
    category: string;
    keywords_found: string[];
  }>;
}

export interface CombinedSentimentResponse {
  success: boolean;
  timestamp: string;
  negative_sentiment: {
    total_posts: number;
    avg_confidence: number;
    top_keywords: string[];
  };
  positive_sentiment: {
    total_posts: number;
    avg_happiness: number;
    category_breakdown: Record<string, number>;
  };
  overall_sentiment: {
    sentiment_ratio: number;
    sentiment_score: number;
    total_posts_analyzed: number;
  };
}

export interface SocialMediaPost {
  id: string;
  title: string;
  content: string;
  author: string;
  created_utc: string;
  score: number;
  num_comments: number;
  url: string;
  subreddit?: string;
  sentiment: 'positive' | 'negative';
  platform: 'reddit' | 'twitter';
  // Additional fields based on sentiment type
  confidence_score?: number;
  keywords_found?: string[];
  happiness_score?: number;
  category?: string;
  // Twitter-specific fields
  likes?: number;
  retweets?: number;
  replies?: number;
}

export interface RecentPostsResponse {
  success: boolean;
  timestamp: string;
  total_posts: number;
  posts: SocialMediaPost[];
}

export interface TwitterNegativeResponse {
  success: boolean;
  timestamp: string;
  total_negative_posts: number;
  from_cache: boolean;
  negative_posts: Array<{
    id: string;
    text: string;
    author: string;
    created_at: string;
    likes: number;
    retweets: number;
    replies: number;
    url: string;
    confidence_score: number;
    keywords_found: string[];
  }>;
}

export interface TwitterHappinessResponse {
  success: boolean;
  timestamp: string;
  total_positive_posts: number;
  average_happiness_score: number;
  from_cache: boolean;
  happiness_posts: Array<{
    id: string;
    text: string;
    author: string;
    created_at: string;
    likes: number;
    retweets: number;
    replies: number;
    url: string;
    happiness_score: number;
    category: string;
    keywords_found: string[];
  }>;
}

// API client functions
export const dashboardApi = {
  // Get historical sentiment data (6 months)
  getHistoricalSentiment: async (): Promise<HistoricalSentimentResponse> => {
    try {
      // Try to get real data from sentiment history endpoint
      const response = await fetch(`${API_BASE_URL}/api/dashboard/sentiment-history`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error('Failed to fetch historical sentiment data:', error);
      throw error;
    }
  },

  // Get recent sentiment summary
  getRecentSentiment: async (): Promise<RecentSentimentResponse> => {
    console.log('🔍 [Dashboard API] Fetching recent sentiment data...');
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-sentiment`);
      if (response.ok) {
        const data = await response.json();
        const duration = Math.round(performance.now() - startTime);
        
        console.log(`✅ [Dashboard API] Recent sentiment fetched in ${duration}ms`);
        console.log(`   Positive: ${data.positive_count}, Negative: ${data.negative_count}`);
        console.log(`   Sentiment ratio: ${data.sentiment_ratio}`);
        console.log(`   Platforms: ${data.platforms_included?.join(', ') || 'reddit only'}`);
        
        // Log platform breakdown if available
        if (data.breakdown) {
          console.log('   Breakdown by platform:');
          if (data.breakdown.reddit) {
            console.log(`     Reddit: +${data.breakdown.reddit.positive} -${data.breakdown.reddit.negative}`);
          }
          if (data.breakdown.twitter) {
            console.log(`     🐦 Twitter: +${data.breakdown.twitter.positive} -${data.breakdown.twitter.negative}`);
          } else {
            console.warn('     ⚠️  Twitter: No data available');
          }
        }
        
        return data;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`❌ [Dashboard API] Failed to fetch recent sentiment (${duration}ms):`, error);
      throw error;
    }
  }, 

  // Get negative sentiment posts (outages/complaints)
  getNegativePosts: async (): Promise<RedditOutageResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reddit/outages`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch negative posts:', error);
      throw error;
    }
  },

  // Get positive sentiment posts (happiness)
  getPositivePosts: async (): Promise<RedditHappinessResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reddit/happiness`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch positive posts:', error);
      throw error;
    }
  },

  // Get combined sentiment analysis
  getCombinedSentiment: async (): Promise<CombinedSentimentResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reddit/sentiment`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch combined sentiment:', error);
      throw error;
    }
  },

  // Health check
  getHealthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reddit/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Get recent social media posts (both positive and negative)
  getRecentPosts: async (limit: number = 10): Promise<RecentPostsResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reddit/recent-posts?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch recent posts:', error);
      throw error;
    }
  },

  // Get Twitter negative posts
  getTwitterNegativePosts: async (useCache: boolean = true): Promise<TwitterNegativeResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/twitter/negative?use_cache=${useCache}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Twitter negative posts:', error);
      throw error;
    }
  },

  // Get Twitter positive posts
  getTwitterPositivePosts: async (useCache: boolean = true): Promise<TwitterHappinessResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/twitter/happiness?use_cache=${useCache}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Twitter positive posts:', error);
      throw error;
    }
  },

  // Get combined recent posts from backend (server-side aggregation - more efficient)
  getCombinedRecentPostsFromBackend: async (limit: number = 10): Promise<RecentPostsResponse> => {
    console.log('🔍 [Dashboard API] Fetching combined posts from backend...');
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/combined-recent-posts?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const duration = Math.round(performance.now() - startTime);
      
      console.log(`✅ [Dashboard API] Combined posts fetched successfully in ${duration}ms`);
      console.log(`   Total posts: ${data.total_posts}`);
      console.log(`   Platforms: ${data.platforms_included?.join(', ') || 'unknown'}`);
      
      // Count posts by platform
      const platformCounts = data.posts?.reduce((acc: any, post: SocialMediaPost) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      }, {});
      console.log('   Platform breakdown:', platformCounts);
      
      // Check if Twitter data is present
      const hasTwitter = data.platforms_included?.includes('twitter');
      if (hasTwitter) {
        const twitterCount = platformCounts?.twitter || 0;
        console.log(`🐦 [Twitter] ${twitterCount} Twitter posts included`);
      } else {
        console.warn('⚠️  [Twitter] No Twitter data in response');
      }
      
      return data;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`❌ [Dashboard API] Failed to fetch combined posts (${duration}ms):`, error);
      throw error;
    }
  },

  // Get combined recent posts from both Reddit and Twitter (client-side aggregation)
  getCombinedRecentPosts: async (limit: number = 10): Promise<RecentPostsResponse> => {
    try {
      // Fetch from both platforms in parallel
      const [redditResponse, twitterNegative, twitterPositive] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/reddit/recent-posts?limit=${limit * 2}`),
        fetch(`${API_BASE_URL}/api/twitter/negative?use_cache=true`),
        fetch(`${API_BASE_URL}/api/twitter/happiness?use_cache=true`)
      ]);

      const allPosts: SocialMediaPost[] = [];

      // Process Reddit posts
      if (redditResponse.status === 'fulfilled' && redditResponse.value.ok) {
        const redditData: RecentPostsResponse = await redditResponse.value.json();
        if (redditData.success && redditData.posts) {
          allPosts.push(...redditData.posts.map(post => ({
            ...post,
            platform: 'reddit' as const
          })));
        }
      }

      // Process Twitter negative posts
      if (twitterNegative.status === 'fulfilled' && twitterNegative.value.ok) {
        const twitterNegData: TwitterNegativeResponse = await twitterNegative.value.json();
        if (twitterNegData.success && twitterNegData.negative_posts) {
          allPosts.push(...twitterNegData.negative_posts.map(post => ({
            id: post.id,
            title: post.text.substring(0, 100), // Use first 100 chars as title
            content: post.text,
            author: post.author,
            created_utc: post.created_at,
            score: post.likes,
            num_comments: post.replies,
            url: post.url,
            sentiment: 'negative' as const,
            platform: 'twitter' as const,
            confidence_score: post.confidence_score,
            keywords_found: post.keywords_found,
            likes: post.likes,
            retweets: post.retweets,
            replies: post.replies
          })));
        }
      }

      // Process Twitter positive posts
      if (twitterPositive.status === 'fulfilled' && twitterPositive.value.ok) {
        const twitterPosData: TwitterHappinessResponse = await twitterPositive.value.json();
        if (twitterPosData.success && twitterPosData.happiness_posts) {
          allPosts.push(...twitterPosData.happiness_posts.map(post => ({
            id: post.id,
            title: post.text.substring(0, 100), // Use first 100 chars as title
            content: post.text,
            author: post.author,
            created_utc: post.created_at,
            score: post.likes,
            num_comments: post.replies,
            url: post.url,
            sentiment: 'positive' as const,
            platform: 'twitter' as const,
            happiness_score: post.happiness_score,
            category: post.category,
            keywords_found: post.keywords_found,
            likes: post.likes,
            retweets: post.retweets,
            replies: post.replies
          })));
        }
      }

      // Sort by date (most recent first)
      allPosts.sort((a, b) => {
        const dateA = new Date(a.created_utc).getTime();
        const dateB = new Date(b.created_utc).getTime();
        return dateB - dateA;
      });

      // Limit results
      const limitedPosts = allPosts.slice(0, limit);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        total_posts: limitedPosts.length,
        posts: limitedPosts
      };
    } catch (error) {
      console.error('Failed to fetch combined posts:', error);
      throw error;
    }
  }
};
