import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { SentimentDataPoint } from '@/lib/api/dashboard'

interface SentimentChartProps {
  data: SentimentDataPoint[]
  height?: number
}

export function SentimentChart({ data, height = 280 }: SentimentChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No sentiment data available
      </div>
    )
  }

  // Transform data for Recharts
  const chartData = data.map(point => ({
    month: new Date(point.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit' 
    }),
    positive: point.positive_count,
    negative: point.negative_count,
    total: point.total_posts,
    ratio: Math.round(point.sentiment_ratio * 100)
  }))

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            fontSize={12}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            fontSize={12}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              color: 'hsl(var(--foreground))'
            }}
            formatter={(value: number, name: string) => [
              value,
              name === 'positive' ? 'Positive Posts' : 'Negative Posts'
            ]}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px'
            }}
            formatter={(value) => 
              value === 'positive' ? 'Positive Posts' : 'Negative Posts'
            }
          />
          <Line
            type="monotone"
            dataKey="positive"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="negative"
            stroke="#dc2626"
            strokeWidth={3}
            dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#dc2626', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
