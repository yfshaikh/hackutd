import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, Users, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useInsights } from '@/hooks/useInsights';
import { AnimatedNumber } from '@/components/ui/animated-number';

const InsightsPage = () => {
  const { data: insights, isLoading, isError, error, refetch, isFetching } = useInsights();
  const [animateBars, setAnimateBars] = useState(false);

  // Trigger bar animations after component mounts
  useEffect(() => {
    if (insights) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setAnimateBars(true), 100);
      return () => clearTimeout(timer);
    }
  }, [insights]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-[hsl(var(--destructive))]';
    if (score >= 50) return 'text-orange-500';
    return 'text-yellow-500';
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Analyzing customer insights...</p>
        </div>
      </div>
    );
  }

  if (isError || !insights) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'No data available'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Churn Risk Pie Chart Data
  const churnRiskData = [
    {
      name: 'At Risk',
      value: insights.churn_analysis.risk_score,
      fill: insights.churn_analysis.risk_score >= 80 ? '#ef4444' : insights.churn_analysis.risk_score >= 50 ? '#f97316' : '#eab308',
    },
    {
      name: 'Safe',
      value: 100 - insights.churn_analysis.risk_score,
      fill: '#1F1F1F',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Insights</h2>
          <p className="text-muted-foreground text-sm">
            AI-powered analysis of {insights.metadata.total_reviews.toLocaleString()} Trustpilot reviews • TrustScore: {insights.metadata.trustscore}/5
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50 tmobile-glow-matte transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Key Metrics - More Compact */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Churn Risk with Animated Pie Chart */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">Churn Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className={`text-2xl font-bold ${getRiskColor(insights.churn_analysis.risk_score)}`}>
                  <AnimatedNumber value={insights.churn_analysis.risk_score} suffix="/100" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <AnimatedNumber value={insights.churn_analysis.risk_percentage} decimals={1} suffix="%" /> at risk
                </p>
              </div>
              <div className="w-16 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={churnRiskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={30}
                      dataKey="value"
                      strokeWidth={0}
                      animationDuration={1500}
                      animationBegin={0}
                    >
                      {churnRiskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Customers */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">At-Risk Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 pb-4">
            <div className="text-2xl font-bold text-orange-500">
              <AnimatedNumber value={insights.churn_analysis.at_risk_customers} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Including <AnimatedNumber value={insights.churn_analysis.high_value_churners || 0} /> long-term
            </p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 pb-4">
            <div className="text-2xl font-bold">
              <AnimatedNumber value={insights.sentiment_analysis.average_rating} decimals={1} suffix="/5" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <AnimatedNumber value={insights.sentiment_analysis.negative_percentage} decimals={1} suffix="%" /> negative
            </p>
          </CardContent>
        </Card>

        {/* Critical Issues */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 pb-4">
            <div className="text-2xl font-bold">
              <AnimatedNumber value={Object.keys(insights.issue_analysis.top_issues).length} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Complaint categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Actionable Insights - Half Width, Compact & Scrollable */}
        <Card className="card-matte">
          <CardHeader>
            <CardTitle className="text-lg">🚨 Priority Actions</CardTitle>
            <CardDescription className="text-xs">Critical actions needed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {insights.actionable_insights.slice(0, 5).map((insight, idx) => (
                <div
                  key={idx}
                  className="border-l-4 p-3 rounded bg-secondary/50"
                  style={{
                    borderLeftColor:
                      insight.severity === 'critical'
                        ? '#ef4444'
                        : insight.severity === 'high'
                        ? '#f97316'
                        : '#eab308',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold truncate">{insight.title}</h4>
                        <Badge
                          variant={insight.severity === 'critical' ? 'destructive' : 'default'}
                          className={`${getSeverityColor(insight.severity)} text-xs px-1 py-0 h-5`}
                        >
                          {insight.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                      <p className="text-xs text-primary mt-1 line-clamp-1">→ {insight.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Common Complaints - Progress Bars */}
        <Card className="card-matte">
          <CardHeader>
            <CardTitle className="text-lg">Most Common Complaints</CardTitle>
            <CardDescription className="text-xs">Frequently mentioned keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {Object.entries(insights.issue_analysis.top_issues)
                .slice(0, 8)
                .map(([keyword, count], idx) => {
                  const maxCount = Math.max(...Object.values(insights.issue_analysis.top_issues));
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{keyword}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all ease-out"
                            style={{
                              width: animateBars ? `${percentage}%` : '0%',
                              background: 'linear-gradient(to right, #ef4444, #f97316)',
                              transitionDuration: `${800 + idx * 100}ms`,
                              transitionDelay: `${idx * 50}ms`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InsightsPage;

