import { useEffect, useState, useMemo } from 'react'
import { Matrix, digits, type Frame } from '@/components/ui/matrix'
import { useQuickStats } from '@/hooks/useDashboard'
import { Card, CardContent } from '@/components/ui/card'

interface StatDisplay {
  value: number
  label: string
}

export function CyclingStatsMatrix() {
  const quickStats = useQuickStats()
  const [currentStatIndex, setCurrentStatIndex] = useState(0)
  const [animationFrame, setAnimationFrame] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // T-Mobile pink color
  const tmobilePink = '#E20074'

  // Define the stats to cycle through
  const stats: StatDisplay[] = [
    {
      value: quickStats.negativePosts,
      label: 'negative posts last 30 days'
    },
    {
      value: quickStats.positivePosts,
      label: 'positive posts last 30 days'
    },
    {
      value: Math.round(Math.abs(quickStats.sentimentScore * 100)),
      label: 'sentiment confidence %'
    },
    {
      value: quickStats.totalPosts,
      label: 'total posts monitored'
    }
  ]

  // Create a combined frame for both digits with padding
  const createCombinedFrame = (num: number): Frame => {
    if (quickStats.isLoading) return Array(9).fill(0).map(() => Array(14).fill(0))
    
    const str = Math.abs(Math.floor(num)).toString().padStart(2, '0')
    const leftDigit = parseInt(str[0])
    const rightDigit = parseInt(str[1])
    
    const combinedFrame: Frame = Array(9).fill(0).map(() => Array(14).fill(0))
    
    // Copy left digit (columns 1-5, rows 1-7)
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        combinedFrame[row + 1][col + 1] = digits[leftDigit][row][col]
      }
    }
    
    // Copy right digit (columns 8-12, rows 1-7, leaving columns 6-7 for connection)
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        combinedFrame[row + 1][col + 8] = digits[rightDigit][row][col]
      }
    }
    
    return combinedFrame
  }

  const currentFrame = useMemo(() => createCombinedFrame(stats[currentStatIndex].value), [stats, currentStatIndex, quickStats.isLoading])
  const nextFrame = useMemo(() => createCombinedFrame(stats[(currentStatIndex + 1) % stats.length].value), [stats, currentStatIndex, quickStats.isLoading])

  // Create animated transition frame
  const getTransitionFrame = (): Frame => {
    if (!isAnimating) return currentFrame
    
    const transitionFrame: Frame = Array(9).fill(0).map(() => Array(14).fill(0))
    const progress = animationFrame / 40 // 40 frames for slower transition
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 14; col++) {
        const pixelDelay = (row * 14 + col) / (9 * 14) // Stagger based on position
        
        if (progress < 0.6) {
          // Fade out current (slower)
          const fadeOutProgress = Math.max(0, Math.min(1, (progress / 0.6 - pixelDelay * 1.5)))
          transitionFrame[row][col] = currentFrame[row][col] * (1 - fadeOutProgress)
        } else {
          // Fade in next (slower)
          const fadeInProgress = Math.max(0, Math.min(1, ((progress - 0.6) / 0.4 - pixelDelay * 1.5)))
          transitionFrame[row][col] = nextFrame[row][col] * fadeInProgress
        }
      }
    }
    
    return transitionFrame
  }

  // Animation logic
  useEffect(() => {
    if (!isAnimating) return
    
    const interval = setInterval(() => {
      setAnimationFrame(prev => {
        if (prev >= 40) {
          setIsAnimating(false)
          setCurrentStatIndex(curr => (curr + 1) % stats.length)
          return 0
        }
        return prev + 1
      })
    }, 50) // 50ms per frame = smooth animation
    
    return () => clearInterval(interval)
  }, [isAnimating, stats.length])

  // Cycle through stats
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setAnimationFrame(0)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const currentStat = stats[currentStatIndex]

  return (
    <Card className="col-span-3 card-matte w-fit mx-auto">
      <CardContent className="p-3">
        <div className="flex items-center justify-center flex-col space-y-2">
          {/* Single Matrix display for both digits */}
          <Matrix
            rows={9}
            cols={14}
            pattern={getTransitionFrame()}
            size={14}
            gap={1}
            palette={{
              on: tmobilePink,
              off: 'hsl(var(--muted-foreground)/0.1)'
            }}
            ariaLabel={`Number ${currentStat.value}`}
          />

          {/* Description text */}
          <p 
            className="text-xs font-medium tracking-wide uppercase text-center"
            style={{ color: tmobilePink }}
          >
            {currentStat.label}
          </p>

          {/* Loading state */}
          {quickStats.isLoading && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Loading...
            </p>
          )}

          {/* Error state */}
          {quickStats.error && (
            <p className="text-xs text-red-500">
              Error loading data
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
