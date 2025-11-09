import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useDashboard, useQuickStats } from '@/hooks/useDashboard'
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { SentimentChart } from '@/components/charts/SentimentChart'
import { CyclingStatsMatrix } from '@/components/dashboard/CyclingStatsMatrix'
import { SocialMediaFeed } from '@/components/dashboard/SocialMediaFeed'

export function Dashboard() {
  const { dashboardSummary, isLoading, isError, refetchAll, isFetching } = useDashboard()
  const quickStats = useQuickStats()

  // Determine sentiment color and icon
  const getSentimentDisplay = (score: number) => {
    if (score > 0.2) return { color: 'text-[hsl(var(--sentiment-positive))]', icon: TrendingUp, label: 'Positive' }
    if (score < -0.2) return { color: 'text-[hsl(var(--sentiment-negative))]', icon: TrendingDown, label: 'Negative' }
    return { color: 'text-[hsl(var(--sentiment-neutral))]', icon: Activity, label: 'Neutral' }
  }

  const sentimentDisplay = getSentimentDisplay(dashboardSummary.overallSentiment?.score || 0)
  const SentimentIcon = sentimentDisplay.icon

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <button
          onClick={refetchAll}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50 tmobile-glow-matte transition-all duration-200"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-matte h-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
          </CardHeader>
          <CardContent className="py-2 pb-4">
            <div className={`text-2xl font-bold ${
              quickStats.networkStatus === 'Operational' 
                ? 'text-[hsl(var(--success))]' 
                : 'text-[hsl(var(--destructive))]'
            }`}>
              {quickStats.isLoading ? 'Loading...' : quickStats.networkStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              {quickStats.networkStatus === 'Operational' 
                ? 'All systems running smoothly' 
                : 'Some issues detected'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-matte h-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <CardTitle className="text-sm font-medium">Customer Sentiment</CardTitle>
            <SentimentIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 pb-4">
            <div className={`text-2xl font-bold ${sentimentDisplay.color}`}>
              {isLoading ? 'Loading...' : sentimentDisplay.label}
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {dashboardSummary.overallSentiment?.score.toFixed(2) || '--'}
            </p>
          </CardContent>
        </Card>

        <div className="col-span-2 h-50">
          <CyclingStatsMatrix />
            </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 card-matte">
          <CardHeader>
            <CardTitle>Positive vs Negative Social Media Posts</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading sentiment data...
              </div>
            ) : isError ? (
              <div className="h-[200px] flex items-center justify-center text-red-500">
                Error loading chart data. Please try refreshing.
              </div>
            ) : dashboardSummary.chartData.length > 0 ? (
              <SentimentChart 
                data={dashboardSummary.chartData.slice(-6)} 
              />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-lg font-medium mb-2">No Data Available</div>
                  <div className="text-sm">
                    Connect your Reddit API to view sentiment data
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 card-matte">
          <CardHeader>
            <CardTitle>Recent Social Media Posts</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] overflow-hidden">
            <SocialMediaFeed />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
