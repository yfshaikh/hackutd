/**
 * TypeScript interfaces for Insights API
 * Matches backend Pydantic models
 */

export interface ChurnAnalysis {
  risk_score: number; // 0-100
  at_risk_customers: number;
  risk_percentage: number;
  top_churn_signals: Record<string, number>;
}

export interface SentimentAnalysis {
  average_rating: number; // 0-5
  negative_percentage: number; // 0-100
  rating_distribution: Record<number, number>;
}

export interface IssueAnalysis {
  top_issues: Record<string, number>;
  issue_percentages: Record<string, string>;
}

export interface ActionableInsight {
  title: string;
  description: string;
  action: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority?: number;
  impact?: string;
  metric?: string;
}

export interface InsightsMetadata {
  total_reviews: number;
  analysis_method: 'zero-shot-classification' | 'keyword-based';
  timestamp?: string;
}

export interface InsightsResponse {
  churn_analysis: ChurnAnalysis;
  sentiment_analysis: SentimentAnalysis;
  issue_analysis: IssueAnalysis;
  actionable_insights: ActionableInsight[];
  metadata: InsightsMetadata;
}

/**
 * Type guard to check if data is valid InsightsResponse
 */
export function isValidInsightsResponse(data: any): data is InsightsResponse {
  return (
    data &&
    typeof data === 'object' &&
    data.churn_analysis &&
    data.sentiment_analysis &&
    data.issue_analysis &&
    Array.isArray(data.actionable_insights) &&
    data.metadata
  );
}

/**
 * Safe accessor for nested properties with fallback
 */
export function safeGetRatingDistribution(
  insights: InsightsResponse | null | undefined
): Record<number, number> {
  return insights?.sentiment_analysis?.rating_distribution || {};
}

export function safeGetTopChurnSignals(
  insights: InsightsResponse | null | undefined
): Record<string, number> {
  return insights?.churn_analysis?.top_churn_signals || {};
}

export function safeGetTopIssues(
  insights: InsightsResponse | null | undefined
): Record<string, number> {
  return insights?.issue_analysis?.top_issues || {};
}

