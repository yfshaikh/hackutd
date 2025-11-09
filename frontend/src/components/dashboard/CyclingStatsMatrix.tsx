import { useEffect, useState, useMemo, useCallback } from 'react'
import { Matrix, digits, type Frame } from '@/components/ui/matrix'
import { useQuickStats } from '@/hooks/useDashboard'
import { Card, CardContent } from '@/components/ui/card'

interface StatDisplay {
  value: number
  label: string
  labelLine2?: string
}

const ROWS = 9
const COLS = 14
const TRANSITION_DURATION_MS = 2000
const DISPLAY_DURATION_MS = 4000
const T_MOBILE_PINK = '#E20074'

export function CyclingStatsMatrix() {
  const quickStats = useQuickStats()
  const [currentStatIndex, setCurrentStatIndex] = useState(0)
  const [transitionProgress, setTransitionProgress] = useState(0) // 0 = fully showing current, 1 = fully showing next
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Define the stats to cycle through
  const stats: StatDisplay[] = useMemo(() => [
    {
      value: quickStats.negativePosts,
      label: 'negative posts',
      labelLine2: 'last 30 days'
    },
    {
      value: quickStats.positivePosts,
      label: 'positive posts',
      labelLine2: 'last 30 days'
    },
    {
      value: Math.round(Math.abs(quickStats.sentimentScore * 100)),
      label: 'sentiment confidence',
      labelLine2: '%'
    },
    {
      value: quickStats.totalPosts,
      label: 'total posts',
      labelLine2: 'monitored'
    }
  ], [quickStats.negativePosts, quickStats.positivePosts, quickStats.sentimentScore, quickStats.totalPosts])

  // Create a frame for a two-digit number
  const createNumberFrame = useCallback((num: number): Frame => {
    const str = Math.abs(Math.floor(num)).toString().padStart(2, '0')
    const leftDigit = parseInt(str[0])
    const rightDigit = parseInt(str[1])
    
    const frame: Frame = Array(ROWS).fill(0).map(() => Array(COLS).fill(0))
    
    // Place left digit (columns 1-5, rows 1-7)
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        frame[row + 1][col + 1] = digits[leftDigit][row][col]
      }
    }
    
    // Place right digit (columns 8-12, rows 1-7)
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        frame[row + 1][col + 8] = digits[rightDigit][row][col]
      }
    }
    
    return frame
  }, [])

  // Get frames for current and next stats
  const currentFrame = useMemo(() => 
    createNumberFrame(stats[currentStatIndex].value),
    [stats, currentStatIndex, createNumberFrame]
  )
  
  const nextFrame = useMemo(() => 
    createNumberFrame(stats[(currentStatIndex + 1) % stats.length].value),
    [stats, currentStatIndex, createNumberFrame]
  )

  // Create transition frame with staggered fade
  const displayFrame = useMemo((): Frame => {
    if (!isTransitioning) return currentFrame
    
    const frame: Frame = Array(ROWS).fill(0).map(() => Array(COLS).fill(0))
    const progress = transitionProgress
    
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // Stagger based on position (top-left to bottom-right)
        const staggerDelay = (row * COLS + col) / (ROWS * COLS) * 0.5
        
        // Fade out current digit
        const fadeOutStart = staggerDelay
        const fadeOutEnd = fadeOutStart + 0.5
        const fadeOutProgress = Math.min(1, Math.max(0, (progress - fadeOutStart) / (fadeOutEnd - fadeOutStart)))
        const currentValue = currentFrame[row][col] * (1 - fadeOutProgress)
        
        // Fade in next digit
        const fadeInStart = 0.5 + staggerDelay
        const fadeInEnd = fadeInStart + 0.5
        const fadeInProgress = Math.min(1, Math.max(0, (progress - fadeInStart) / (fadeInEnd - fadeInStart)))
        const nextValue = nextFrame[row][col] * fadeInProgress
        
        frame[row][col] = currentValue + nextValue
      }
    }
    
    return frame
  }, [isTransitioning, transitionProgress, currentFrame, nextFrame])

  // Handle cycling through stats
  useEffect(() => {
    let displayTimer: number
    let animationFrame: number | null = null
    let startTime: number | null = null

    const startTransition = () => {
      setIsTransitioning(true)
      setTransitionProgress(0)
      startTime = performance.now()
      
      const animate = (currentTime: number) => {
        if (!startTime) return
        
        const elapsed = currentTime - startTime
        const progress = Math.min(1, elapsed / TRANSITION_DURATION_MS)
        
        setTransitionProgress(progress)
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate)
        } else {
          // Transition complete
          setIsTransitioning(false)
          setTransitionProgress(0)
          setCurrentStatIndex(prev => (prev + 1) % stats.length)
          
          // Schedule next transition
          displayTimer = setTimeout(startTransition, DISPLAY_DURATION_MS)
        }
      }
      
      animationFrame = requestAnimationFrame(animate)
    }

    // Initial display, then start cycling
    displayTimer = setTimeout(startTransition, DISPLAY_DURATION_MS)

    return () => {
      clearTimeout(displayTimer)
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [stats.length])

  const currentStat = stats[currentStatIndex]

  return (
    <Card className="card-matte h-full">
      <CardContent className="px-4 py-3 h-full">
        <div className="flex items-center justify-between h-full gap-6">
          <div className="shrink-0">
          <Matrix
            rows={ROWS}
            cols={COLS}
            pattern={displayFrame}
            size={16}
            gap={2}
            palette={{
              on: T_MOBILE_PINK,
              off: 'hsl(var(--muted-foreground)/0.1)'
            }}
            ariaLabel={`Number ${currentStat.value}`}
          />
          </div>

          <div className="flex flex-col justify-end flex-1 min-w-0">
          <div 
              className="transition-opacity duration-300"
            style={{ 
              opacity: isTransitioning ? 0.5 : 1
            }}
          >
              <p className="text-3xl font-bold tracking-wide text-white leading-tight">
              {currentStat.label}
            </p>
              {currentStat.labelLine2 && (
                <p className="text-3xl font-bold tracking-wide text-white leading-tight">
                {currentStat.labelLine2}
              </p>
              )}
          </div>

          {quickStats.isLoading && (
              <p className="text-xs text-muted-foreground animate-pulse mt-2">
              Loading...
            </p>
          )}

          {quickStats.error && (
              <p className="text-xs text-red-500 mt-2">
              Error loading data
            </p>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
