import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, Users, AlertTriangle, BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  InsightsResponse,
  safeGetRatingDistribution,
  safeGetTopChurnSignals,
  safeGetTopIssues,
  isValidInsightsResponse
} from '@/types/insights';

interface ChurnAnalysis {
  risk_score: number;
  risk_percentage: number;
  at_risk_customers: number;
  high_value_churners?: number;
  top_churn_signals?: Record<string, number>;
  competitor_mentions?: Record<string, number>;
}

interface IssueAnalysis {
  top_issues: Record<string, number>;
  issue_percentages: Record<string, number>;
  top_keywords: Record<string, number>;
}

interface SentimentAnalysis {
  average_rating: number;
  negative_percentage: number;
  rating_distribution: Record<string, number>;
}

interface ActionableInsight {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  description: string;
  action: string;
  impact: string;
  priority: number;
}

interface InsightsData {
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

const InsightsPage = () => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      console.log('📊 Fetching insights from API...');
      const response = await fetch('http://localhost:8000/insights');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Insights data received:', data);
      
      // Validate data structure
      if (!data.churn_analysis || !data.sentiment_analysis || !data.issue_analysis) {
        console.error('❌ Invalid data structure:', data);
        throw new Error('Invalid insights data structure');
      }
      
      // Ensure nested objects exist with defaults
      const validatedData = {
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
      
      console.log('✅ Data validated and set');
      setInsights(validatedData);
    } catch (err) {
      console.error('❌ Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Analyzing customer insights...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'No data available'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare chart data
  const issuesChartData = Object.entries(insights.issue_analysis.top_issues).slice(0, 8).map(([name, value]) => ({
    name: name.replace(' & ', '\n'),
    count: value,
    percentage: insights.issue_analysis.issue_percentages[name],
  }));

  // Safe data extraction with fallbacks to prevent crashes
  const ratingDistribution = insights?.sentiment_analysis?.rating_distribution || {};
  const sentimentChartData = Object.entries(ratingDistribution).map(([stars, count]) => ({
    name: `${stars} Star${stars === '1' ? '' : 's'}`,
    value: count,
    fill: stars === '1' ? '#ef4444' : stars === '2' ? '#f97316' : stars === '3' ? '#eab308' : stars === '4' ? '#84cc16' : '#22c55e',
  }));

  const topChurnSignals = insights?.churn_analysis?.top_churn_signals || {};
  const churnSignalsData = Object.entries(topChurnSignals).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value,
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-yellow-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Customer Insights Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered analysis of {insights.metadata.total_reviews} Trustpilot reviews • TrustScore: {insights.metadata.trustscore}/5
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getRiskColor(insights.churn_analysis.risk_score)}`}>
              {insights.churn_analysis.risk_score}/100
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.churn_analysis.risk_percentage}% showing intent to leave
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Customers</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{insights.churn_analysis.at_risk_customers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Including {insights.churn_analysis.high_value_churners} long-term customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.sentiment_analysis.average_rating}/5</div>
            <p className="text-xs text-muted-foreground mt-1">
              {insights.sentiment_analysis.negative_percentage}% negative reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <BarChart3 className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Object.keys(insights.issue_analysis.top_issues).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Identified complaint categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Insights */}
      <Card>
        <CardHeader>
          <CardTitle>🚨 Actionable Insights</CardTitle>
          <CardDescription>Prioritized actions to improve customer satisfaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.actionable_insights.map((insight, idx) => (
              <Alert key={idx} className="border-l-4" style={{ borderLeftColor: insight.severity === 'critical' ? '#ef4444' : insight.severity === 'high' ? '#f97316' : '#eab308' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTitle className="mb-0">{insight.title}</AlertTitle>
                      <Badge variant={insight.severity === 'critical' ? 'destructive' : 'default'} className={getSeverityColor(insight.severity)}>
                        {insight.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <AlertDescription className="mt-2">
                      <div className="space-y-1">
                        <p><strong>Impact:</strong> {insight.metric} • {insight.description}</p>
                        <p className="text-primary"><strong>Recommended Action:</strong> {insight.action}</p>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customer Issues</CardTitle>
            <CardDescription>Most frequently mentioned complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issuesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-semibold">{payload[0].payload.name}</p>
                        <p className="text-sm">Count: {payload[0].value}</p>
                        <p className="text-sm">Percentage: {payload[0].payload.percentage}%</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of customer ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {sentimentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn Signals */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Warning Signals</CardTitle>
            <CardDescription>Indicators of customer intent to leave</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={churnSignalsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Complaints</CardTitle>
            <CardDescription>Frequently mentioned keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(insights.issue_analysis.top_issues).slice(0, 10).map(([keyword, count], idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{keyword}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full mt-1">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(count / Math.max(...Object.values(insights.issue_analysis.top_issues))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InsightsPage;

