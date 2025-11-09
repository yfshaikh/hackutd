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
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-sentiment`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error('Failed to fetch recent sentiment data:', error);
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
  }
};
