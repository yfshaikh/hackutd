const API_BASE_URL = "http://localhost:8000"

export interface CallCenterKPIs {
  avg_csat: number;
  sentiment_index: number;
  fcr_rate: number;
  avg_call_duration_minutes: number;
  top_issue_category: string;
  top_issue_count: number;
  total_calls: number;
}

export interface CategoryStat {
  category: string;
  avg_call_duration_seconds: number;
  avg_csat: number;
  call_count: number;
  sentiment_distribution: Record<string, number>;
  sentiment_percentages: Record<string, number>;
  insight_flag: string | null;
}

export interface SubcategoryStat {
  subcategory: string;
  category: string;
  avg_csat: number;
  avg_sentiment_score: number;
  avg_call_duration_minutes: number;
  call_count: number;
  sentiment_bias: string;
  sentiment_counts: Record<string, number>;
  fcr_percentage: number;
  resolution_breakdown: Record<string, number>;
  root_cause_hypothesis: string | null;
  recommended_action: string | null;
}

export interface HeatmapCell {
  category: string;
  subcategory: string;
  avg_csat: number;
  call_count: number;
}

export const getHappinessOverview = async () => {
  const response = await fetch(`${API_BASE_URL}/callcenter/overview`);
  if (!response.ok) throw new Error('Failed to fetch happiness overview');
  return response.json();
};

export const getCategoryAnalysis = async () => {
  const response = await fetch(`${API_BASE_URL}/callcenter/category-analysis`);
  if (!response.ok) throw new Error('Failed to fetch category analysis');
  return response.json();
};

export const getSubcategoryAnalysis = async (category?: string) => {
  const url = category 
    ? `${API_BASE_URL}/callcenter/subcategory-analysis?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/callcenter/subcategory-analysis`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch subcategory analysis');
  return response.json();
};

export const getSubcategoryHeatmap = async () => {
  const response = await fetch(`${API_BASE_URL}/callcenter/heatmap`);
  if (!response.ok) throw new Error('Failed to fetch heatmap data');
  return response.json();
};

