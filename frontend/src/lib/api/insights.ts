/**
 * Insights API - HTTP client functions for insights data
 */

const API_BASE_URL = 'http://localhost:8000';

// Types for API responses
export interface ChurnAnalysis {
  risk_score: number;
  risk_percentage: number;
  at_risk_customers: number;
  high_value_churners?: number;
  top_churn_signals?: Record<string, number>;
  competitor_mentions?: Record<string, number>;
}

export interface IssueAnalysis {
  top_issues: Record<string, number>;
  issue_percentages: Record<string, number>;
  top_keywords: Record<string, number>;
}

export interface SentimentAnalysis {
  average_rating: number;
  negative_percentage: number;
  rating_distribution: Record<string, number>;
}

export interface ActionableInsight {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  description: string;
  action: string;
  impact: string;
  priority: number;
}

export interface InsightsResponse {
  metadata: {
    total_reviews: number;
    trustscore: number;
    analysis_timestamp: string;
  };
  churn_analysis: ChurnAnalysis;
  issue_analysis: IssueAnalysis;
  sentiment_analysis: SentimentAnalysis;
  actionable_insights: ActionableInsight[];
}

// API client functions
export const insightsApi = {
  // Get Trustpilot insights data
  getInsights: async (): Promise<InsightsResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/insights`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data)
      
      // Validate data structure
      if (!data.churn_analysis || !data.sentiment_analysis || !data.issue_analysis) {
        throw new Error('Invalid insights data structure');
      }
      
      // Ensure nested objects exist with defaults
      return {
        ...data,
        churn_analysis: {
          ...data.churn_analysis,
          top_churn_signals: data.churn_analysis?.top_churn_signals || {}
        },
        sentiment_analysis: {
          ...data.sentiment_analysis,
          rating_distribution: data.sentiment_analysis?.rating_distribution || {}
        }
      };
    } catch (error) {
      console.error('Failed to fetch insights data:', error);
      throw error;
    }
  },
};

