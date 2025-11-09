import { useEffect, useState, useMemo, useRef } from 'react'
import { Matrix, digits, type Frame } from '@/components/ui/matrix'
import { useQuickStats } from '@/hooks/useDashboard'
import { Card, CardContent } from '@/components/ui/card'

interface StatDisplay {
  value: number
  label: string
}

export function CyclingStatsMatrix() {
  const quickStats = useQuickStats()
  const [displayedStatIndex, setDisplayedStatIndex] = useState(0) // What's currently shown
  const [targetStatIndex, setTargetStatIndex] = useState(0) // What we're animating to
  const [animationFrame, setAnimationFrame] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const currentIndexRef = useRef(0) // Track the actual current index

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

  const currentFrame = useMemo(() => createCombinedFrame(stats[displayedStatIndex].value), [stats, displayedStatIndex, quickStats.isLoading])
  const nextFrame = useMemo(() => createCombinedFrame(stats[targetStatIndex].value), [stats, targetStatIndex, quickStats.isLoading])

  // Create animated transition frame
  const getTransitionFrame = (): Frame => {
    // After animation completes, keep showing the frame we animated to
    if (!isAnimating && animationFrame >= 40) return nextFrame
    if (!isAnimating) return currentFrame
    
    const transitionFrame: Frame = Array(9).fill(0).map(() => Array(14).fill(0))
    const progress = animationFrame / 40 // 40 frames for slower transition
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 14; col++) {
        // Create a smoother stagger pattern - diagonal from top-left to bottom-right
        const pixelDelay = (row + col) / (9 + 14 - 2) // Normalized 0-1
        
        // Create overlapping fade transitions for smoother animation
        const fadeOutStart = pixelDelay * 0.3 // Start fade-out at different times
        const fadeOutEnd = fadeOutStart + 0.5 // 50% of animation for fade-out
        const fadeInStart = fadeOutStart + 0.25 // Start fade-in midway through fade-out
        const fadeInEnd = fadeInStart + 0.5 // 50% of animation for fade-in
        
        let currentPixelValue = 0
        let nextPixelValue = 0
        
        // Calculate fade-out progress
        if (progress >= fadeOutStart && progress <= fadeOutEnd) {
          const fadeOutProgress = (progress - fadeOutStart) / (fadeOutEnd - fadeOutStart)
          const easedFadeOut = 1 - Math.pow(fadeOutProgress, 2) // Ease-out curve
          currentPixelValue = currentFrame[row][col] * easedFadeOut
        } else if (progress < fadeOutStart) {
          currentPixelValue = currentFrame[row][col]
        }
        
        // Calculate fade-in progress
        if (progress >= fadeInStart && progress <= fadeInEnd) {
          const fadeInProgress = (progress - fadeInStart) / (fadeInEnd - fadeInStart)
          const easedFadeIn = Math.pow(fadeInProgress, 2) // Ease-in curve
          nextPixelValue = nextFrame[row][col] * easedFadeIn
        } else if (progress > fadeInEnd) {
          nextPixelValue = nextFrame[row][col]
        }
        
        // Combine both values for smooth transition
        transitionFrame[row][col] = Math.max(currentPixelValue, nextPixelValue)
      }
    }
    
    return transitionFrame
  }

  // Single animation cycle controller
  useEffect(() => {
    let cycleInterval: ReturnType<typeof setInterval>
    let animationInterval: ReturnType<typeof setInterval>
    
    const runCycle = () => {
      // Phase 1: Prepare to animate to the next stat using the ref
      const nextIndex = (currentIndexRef.current + 1) % stats.length
      currentIndexRef.current = nextIndex
      
      setTargetStatIndex(nextIndex)
      setIsAnimating(true)
      setAnimationFrame(0)
      
      // Phase 2: Run animation frames
      let frameCount = 0
      animationInterval = setInterval(() => {
        frameCount++
        setAnimationFrame(frameCount)
        
        if (frameCount >= 40) {
          clearInterval(animationInterval)
          setIsAnimating(false)
          
          // Phase 3: Animation complete - update displayed to match target
          setDisplayedStatIndex(nextIndex)
        }
      }, 50) // 50ms per frame
    }
    
    // Wait 2 seconds before starting first animation (show initial stat)
    const initialTimeout = setTimeout(() => {
      runCycle()
      
      // Then repeat every 4 seconds (2s animation + 2s display)
      cycleInterval = setInterval(runCycle, 4000)
    }, 2000)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(cycleInterval)
      clearInterval(animationInterval)
    }
  }, [stats.length])

  // Show the label for what's actually displayed
  const currentStat = stats[targetStatIndex]

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
