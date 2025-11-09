import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, Phone } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { getHappinessOverview } from '@/lib/api/callcenter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CallCenterKPIs {
  avg_csat: number;
  sentiment_index: number;
  fcr_rate: number;
  avg_call_duration_minutes: number;
  top_issue_category: string;
  top_issue_count: number;
  total_calls: number;
}

interface OverviewData {
  kpis: CallCenterKPIs;
  trends: {
    call_volume_by_category: Record<string, number>;
    sentiment_by_category: Record<string, number>;
  };
}

export const CustomerHappinessOverview = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getHappinessOverview();
        setData(result);
      } catch (error) {
        console.error('Error fetching happiness overview:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Customer Happiness Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="card-matte animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-secondary rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-secondary rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No call center data available
      </div>
    );
  }

  const { kpis, trends } = data;

  // Prepare chart data
  const chartData = Object.entries(trends.call_volume_by_category).map(([category, volume]) => ({
    category,
    volume,
    sentiment: trends.sentiment_by_category[category] || 0,
  })).sort((a, b) => b.volume - a.volume);

  const getCSATColor = (score: number) => {
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.5) return 'text-green-500';
    if (score >= 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Customer Happiness Overview</h3>
        <p className="text-sm text-muted-foreground">
          Executive-level view of customer experience health across {kpis.total_calls.toLocaleString()} calls
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Average CSAT */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CSAT Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCSATColor(kpis.avg_csat)}`}>
              <AnimatedNumber value={kpis.avg_csat} decimals={2} suffix="/5" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Customer satisfaction</p>
          </CardContent>
        </Card>

        {/* Sentiment Index */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentiment Index</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSentimentColor(kpis.sentiment_index)}`}>
              <AnimatedNumber value={kpis.sentiment_index} decimals={2} prefix={kpis.sentiment_index >= 0 ? '+' : ''} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">-1 (negative) to +1 (positive)</p>
          </CardContent>
        </Card>

        {/* FCR Rate */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FCR Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              <AnimatedNumber value={kpis.fcr_rate} decimals={1} suffix="%" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">First-call resolution</p>
          </CardContent>
        </Card>

        {/* Avg Call Duration */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={kpis.avg_call_duration_minutes} decimals={1} suffix=" min" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Call efficiency</p>
          </CardContent>
        </Card>

        {/* Top Issue Category */}
        <Card className="card-matte">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Issue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate" title={kpis.top_issue_category}>
              {kpis.top_issue_category}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <AnimatedNumber value={kpis.top_issue_count} /> calls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="card-matte">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Call Volume & Sentiment by Category</CardTitle>
          <CardDescription>Compare volume and emotional tone across issue categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="category" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Call Volume', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--foreground))' }}
                domain={[-1, 1]}
                label={{ value: 'Sentiment', angle: 90, position: 'insideRight', fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="volume" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Call Volume"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="sentiment" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Sentiment Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

