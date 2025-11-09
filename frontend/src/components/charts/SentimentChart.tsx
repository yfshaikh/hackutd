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
      <div className="h-full flex items-center justify-center text-muted-foreground surface-matte rounded-lg">
        <div className="text-center p-6">
          <div className="text-lg font-medium mb-2">No sentiment data available</div>
          <div className="text-sm opacity-70">Data will appear here once sentiment analysis is complete</div>
        </div>
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
    <div className="w-full surface-matte rounded-lg p-4" style={{ height }}>
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
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#404040"
            opacity={0.6}
          />
          <XAxis 
            dataKey="month" 
            fontSize={12}
            tick={{ fill: '#D1D5DB' }}
            axisLine={{ stroke: '#2A2A2A' }}
            tickLine={{ stroke: '#2A2A2A' }}
          />
          <YAxis 
            fontSize={12}
            tick={{ fill: '#D1D5DB' }}
            axisLine={{ stroke: '#2A2A2A' }}
            tickLine={{ stroke: '#2A2A2A' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#161616',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
              color: '#F5F5F5',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)'
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
              fontSize: '14px',
              color: '#D1D5DB'
            }}
            formatter={(value) => 
              <span style={{ color: '#D1D5DB' }}>
                {value === 'positive' ? 'Positive Posts' : 'Negative Posts'}
              </span>
            }
          />
          <Line
            type="monotone"
            dataKey="positive"
            stroke="#22C55E"
            strokeWidth={3}
            dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#22C55E', strokeWidth: 2, fill: '#22C55E' }}
          />
          <Line
            type="monotone"
            dataKey="negative"
            stroke="#EF4444"
            strokeWidth={3}
            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#EF4444' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
