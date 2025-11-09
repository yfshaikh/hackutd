import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingDown, Clock, Target, Lightbulb } from 'lucide-react';
import { getSubcategoryAnalysis, getSubcategoryHeatmap } from '@/lib/api/callcenter';

interface SubcategoryStat {
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

interface HeatmapCell {
  category: string;
  subcategory: string;
  avg_csat: number;
  call_count: number;
}

interface SubcategoryAnalysis {
  subcategories: SubcategoryStat[];
  total_subcategories: number;
  filtered_by_category: string | null;
}

interface HeatmapData {
  heatmap: HeatmapCell[];
  categories: string[];
  min_csat: number;
  max_csat: number;
}

export const SubcategoryRootCause = () => {
  const [data, setData] = useState<SubcategoryAnalysis | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData(selectedCategory);
  }, [selectedCategory]);

  const fetchData = async (category: string | null) => {
    setLoading(true);
    try {
      const [subcategoryResult, heatmapResult] = await Promise.all([
        getSubcategoryAnalysis(category || undefined),
        getSubcategoryHeatmap()
      ]);
      setData(subcategoryResult);
      setHeatmapData(heatmapResult);
    } catch (error) {
      console.error('Error fetching subcategory analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Subcategory Root-Cause Lens</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !heatmapData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No subcategory data available
      </div>
    );
  }

  const { subcategories } = data;

  // Group heatmap data by category
  const heatmapByCategory = heatmapData.categories.map(category => {
    const cells = heatmapData.heatmap.filter(cell => cell.category === category);
    return { category, cells };
  });

  const getCSATColor = (csat: number) => {
    const normalized = (csat - heatmapData.min_csat) / (heatmapData.max_csat - heatmapData.min_csat);
    if (normalized <= 0.33) return 'bg-red-500/80';
    if (normalized <= 0.66) return 'bg-yellow-500/80';
    return 'bg-green-500/80';
  };

  const getCSATTextColor = (csat: number) => {
    if (csat >= 4) return 'text-green-500';
    if (csat >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSentimentBadgeColor = (sentiment: string) => {
    const colors = {
      positive: 'bg-green-500',
      neutral: 'bg-yellow-500',
      negative: 'bg-red-500',
      mixed: 'bg-blue-500'
    };
    return colors[sentiment as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-1">Subcategory Root-Cause Lens</h3>
        <p className="text-sm text-muted-foreground">
          Drill down to isolate specific subcategories driving negative sentiment
        </p>
      </div>

      {/* Category Filter */}
      <Card className="card-matte">
        <CardHeader>
          <CardTitle className="text-base">Filter by Category</CardTitle>
          <CardDescription>Select a category to drill down, or view all</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {heatmapData.categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card className="card-matte">
        <CardHeader>
          <CardTitle className="text-base">CSAT Heatmap: Category → Subcategory</CardTitle>
          <CardDescription>Quickly identify problematic areas (red = low CSAT, green = high CSAT)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {heatmapByCategory.map(({ category, cells }) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold text-sm">{category}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {cells.map((cell, idx) => (
                    <div
                      key={idx}
                      className={`${getCSATColor(cell.avg_csat)} p-3 rounded-lg text-white cursor-pointer hover:scale-105 transition-transform`}
                      title={`${cell.subcategory}: CSAT ${cell.avg_csat.toFixed(2)} (${cell.call_count} calls)`}
                    >
                      <div className="text-xs font-medium truncate">{cell.subcategory}</div>
                      <div className="text-lg font-bold">{cell.avg_csat.toFixed(1)}</div>
                      <div className="text-xs opacity-90">{cell.call_count} calls</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Subcategory Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        {subcategories.slice(0, 6).map((sub, idx) => (
          <Card key={idx} className="card-matte">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{sub.subcategory}</CardTitle>
                  <CardDescription className="text-xs">{sub.category}</CardDescription>
                </div>
                <Badge className={getSentimentBadgeColor(sub.sentiment_bias)}>
                  {sub.sentiment_bias}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-secondary/50 p-2 rounded">
                  <div className={`text-lg font-bold ${getCSATTextColor(sub.avg_csat)}`}>
                    {sub.avg_csat.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg CSAT</div>
                </div>
                <div className="bg-secondary/50 p-2 rounded">
                  <div className="text-lg font-bold flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    {sub.avg_call_duration_minutes.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Minutes</div>
                </div>
                <div className="bg-secondary/50 p-2 rounded">
                  <div className="text-lg font-bold">
                    {sub.fcr_percentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">FCR Rate</div>
                </div>
              </div>

              {/* Sentiment Breakdown */}
              <div>
                <div className="text-xs font-medium mb-1">Sentiment Distribution</div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                  {Object.entries(sub.sentiment_counts).map(([sentiment, count]) => {
                    const percentage = (count / sub.call_count) * 100;
                    const colors = {
                      positive: 'bg-green-500',
                      neutral: 'bg-yellow-500',
                      negative: 'bg-red-500',
                      mixed: 'bg-blue-500'
                    };
                    return (
                      <div
                        key={sentiment}
                        className={colors[sentiment as keyof typeof colors]}
                        style={{ width: `${percentage}%` }}
                        title={`${sentiment}: ${count} (${percentage.toFixed(0)}%)`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  {Object.entries(sub.sentiment_counts).map(([sentiment, count]) => (
                    <span key={sentiment} className="capitalize">
                      {sentiment}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Root Cause & Action */}
              {sub.root_cause_hypothesis && (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-orange-500">Root Cause Hypothesis</div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {sub.root_cause_hypothesis}
                      </p>
                    </div>
                  </div>
                  {sub.recommended_action && (
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-blue-500">Recommended Action</div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {sub.recommended_action}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Call Volume */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                {sub.call_count} total calls analyzed
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {subcategories.length > 6 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing top 6 subcategories by priority. {subcategories.length - 6} more available.
        </div>
      )}
    </div>
  );
};

