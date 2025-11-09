import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useDashboard, useQuickStats } from '@/hooks/useDashboard'
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { SentimentChart } from '@/components/charts/SentimentChart'

export function Dashboard() {
  const { dashboardSummary, isLoading, isError, refetchAll, isFetching } = useDashboard()
  const quickStats = useQuickStats()

  // Determine sentiment color and icon
  const getSentimentDisplay = (score: number) => {
    if (score > 0.2) return { color: 'text-green-600', icon: TrendingUp, label: 'Positive' }
    if (score < -0.2) return { color: 'text-red-600', icon: TrendingDown, label: 'Negative' }
    return { color: 'text-yellow-600', icon: Activity, label: 'Neutral' }
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
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              quickStats.networkStatus === 'Operational' ? 'text-green-600' : 'text-red-600'
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
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Sentiment</CardTitle>
            <SentimentIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${sentimentDisplay.color}`}>
              {isLoading ? 'Loading...' : sentimentDisplay.label}
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {dashboardSummary.overallSentiment?.score.toFixed(2) || '--'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? 'Loading...' : quickStats.totalPosts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentiment Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? 'Loading...' : `${Math.round((dashboardSummary.overallSentiment?.ratio || 0) * 100)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Positive sentiment
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
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
                height={280} 
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
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Positive Posts</span>
                <span className="text-sm font-medium text-green-600">
                  {isLoading ? '--' : quickStats.positivePosts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Negative Posts</span>
                <span className="text-sm font-medium text-red-600">
                  {isLoading ? '--' : quickStats.negativePosts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sentiment Score</span>
                <span className={`text-sm font-medium ${sentimentDisplay.color}`}>
                  {isLoading ? '--' : (dashboardSummary.overallSentiment?.score.toFixed(2) || '--')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
