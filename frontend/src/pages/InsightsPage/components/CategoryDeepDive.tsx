import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Clock, Users } from 'lucide-react';
import { getCategoryAnalysis } from '@/lib/api/callcenter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface CategoryStat {
  category: string;
  avg_call_duration_seconds: number;
  avg_csat: number;
  call_count: number;
  sentiment_distribution: Record<string, number>;
  sentiment_percentages: Record<string, number>;
  insight_flag: string | null;
}

interface CategoryAnalysis {
  categories: CategoryStat[];
  total_categories: number;
}

export const CategoryDeepDive = () => {
  const [data, setData] = useState<CategoryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCategoryAnalysis();
        setData(result);
      } catch (error) {
        console.error('Error fetching category analysis:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Category Deep Dive</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-secondary rounded"></div>
          <div className="h-48 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No category data available
      </div>
    );
  }

  const { categories } = data;

  const getInsightBadge = (flag: string | null) => {
    if (!flag) return null;
    
    const badges = {
      high_volume_low_satisfaction: { 
        text: '🚨 Urgent: High Volume + Low Satisfaction', 
        variant: 'destructive' as const,
        description: 'Urgent improvement needed'
      },
      low_volume_high_duration: { 
        text: '⚠️ Complex: Low Volume + Long Duration', 
        variant: 'default' as const,
        description: 'Workflow/knowledgebase fix needed'
      },
      high_satisfaction_high_duration: { 
        text: '💡 Opportunity: Good CSAT but Long Calls', 
        variant: 'default' as const,
        description: 'Automation opportunity'
      }
    };

    const info = badges[flag as keyof typeof badges];
    if (!info) return null;

    return (
      <div className="mt-2">
        <Badge variant={info.variant} className="text-xs">
          {info.text}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
      </div>
    );
  };

  // Prepare chart data
  const csatChartData = categories.map(cat => ({
    category: cat.category,
    csat: cat.avg_csat,
    duration: cat.avg_call_duration_seconds / 60, // convert to minutes
  }));

  const volumeChartData = categories.map(cat => ({
    category: cat.category,
    count: cat.call_count,
  }));

  const getCSATColor = (csat: number) => {
    if (csat >= 4) return '#10b981'; // green
    if (csat >= 3) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Category Deep Dive</h3>
        <p className="text-sm text-muted-foreground">
          Understand performance across {categories.length} major issue categories
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Call Volume by Category */}
        <Card className="card-matte">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4" />
              Call Volume by Category
            </CardTitle>
            <CardDescription>Where customers need most help</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={volumeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  width={120}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" name="Calls" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CSAT by Category */}
        <Card className="card-matte">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4 w-4" />
              Avg CSAT by Category
            </CardTitle>
            <CardDescription>Identify dissatisfaction hotspots</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={csatChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  domain={[0, 5]} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  width={120}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="csat" name="Avg CSAT">
                  {csatChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCSATColor(entry.csat)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Call Duration by Category */}
        <Card className="card-matte">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4" />
              Avg Call Duration by Category
            </CardTitle>
            <CardDescription>Spots complex/time-consuming issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={csatChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  width={120}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} min`, 'Duration']}
                />
                <Bar dataKey="duration" fill="#f97316" name="Duration (min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card className="card-matte">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Key Insights & Patterns
            </CardTitle>
            <CardDescription>Categories requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {categories.filter(cat => cat.insight_flag).length === 0 ? (
                <p className="text-sm text-muted-foreground">No critical patterns detected</p>
              ) : (
                categories
                  .filter(cat => cat.insight_flag)
                  .map((cat, idx) => (
                    <div key={idx} className="border-l-4 border-orange-500 pl-3 py-2">
                      <h4 className="font-semibold text-sm">{cat.category}</h4>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>CSAT: {cat.avg_csat.toFixed(2)}</span>
                        <span>Calls: {cat.call_count}</span>
                        <span>Duration: {(cat.avg_call_duration_seconds / 60).toFixed(1)}m</span>
                      </div>
                      {getInsightBadge(cat.insight_flag)}
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Category Table */}
      <Card className="card-matte">
        <CardHeader>
          <CardTitle className="text-base">Sentiment Distribution by Category</CardTitle>
          <CardDescription>Emotional drivers across issue types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div key={idx} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{cat.category}</h4>
                  <span className="text-sm text-muted-foreground">{cat.call_count} calls</span>
                </div>
                <div className="flex gap-2">
                  {Object.entries(cat.sentiment_percentages).map(([sentiment, percentage]) => {
                    const colors = {
                      positive: 'bg-green-500',
                      neutral: 'bg-yellow-500',
                      negative: 'bg-red-500',
                      mixed: 'bg-blue-500'
                    };
                    return (
                      <div key={sentiment} className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="capitalize">{sentiment}</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${colors[sentiment as keyof typeof colors]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

