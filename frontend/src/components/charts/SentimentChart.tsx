import { useMemo } from 'react'
import { LineChart } from '@/components/ui/line-chart'
import type { SentimentDataPoint } from '@/lib/api/dashboard'

interface SentimentChartProps {
  data: SentimentDataPoint[]
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map(point => ({
      month: new Date(point.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      }),
      positive: point.positive_count,
      negative: point.negative_count,
    }))
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground surface-matte rounded-lg">
        <div className="text-center p-6">
          <div className="text-lg font-medium mb-2">No sentiment data available</div>
          <div className="text-sm opacity-70">Data will appear here once sentiment analysis is complete</div>
        </div>
      </div>
    )
  }

  return (
    <LineChart
      className="w-full h-[280px]"
      data={chartData}
      dataKey="month"
      config={{
        positive: { 
          label: "Positive Posts",
          color: "hsl(142, 45%, 45%)" // More matte green
        },
        negative: { 
          label: "Negative Posts",
          color: "hsl(0, 50%, 50%)" // More matte red
        },
      }}
      xAxisProps={{
        tick: { fill: 'hsl(0, 0%, 60%)' }, // Grey axis labels
        axisLine: { stroke: 'hsl(0, 0%, 50%)' }, // Grey axis line
      }}
      yAxisProps={{
        tick: { fill: 'hsl(0, 0%, 60%)' }, // Grey axis labels
        axisLine: { stroke: 'hsl(0, 0%, 50%)' }, // Grey axis line
      }}
      lineProps={{
        strokeWidth: 3,
        dot: { strokeWidth: 2, r: 4 },
      }}
    />
  )
}
