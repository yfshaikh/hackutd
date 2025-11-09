/**
 * Dashboard Hook - TanStack Query hooks for dashboard data management
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { 
  dashboardApi, 
  type HistoricalSentimentResponse, 
  type RecentSentimentResponse,
  type RedditOutageResponse,
  type RedditHappinessResponse,
  type CombinedSentimentResponse,
  type RecentPostsResponse
} from '@/lib/api/dashboard';

// Query keys for consistent caching
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  historicalSentiment: () => [...dashboardQueryKeys.all, 'historical-sentiment'] as const,
  recentSentiment: () => [...dashboardQueryKeys.all, 'recent-sentiment'] as const,
  negativePosts: () => [...dashboardQueryKeys.all, 'negative-posts'] as const,
  positivePosts: () => [...dashboardQueryKeys.all, 'positive-posts'] as const,
  combinedSentiment: () => [...dashboardQueryKeys.all, 'combined-sentiment'] as const,
  healthCheck: () => [...dashboardQueryKeys.all, 'health'] as const,
  recentPosts: () => [...dashboardQueryKeys.all, 'recent-posts'] as const,
} as const;

// Stale times for different types of data (in milliseconds)
// Adjusted for demo purposes - data stays fresh longer to use cached backend data
const STALE_TIMES = {
  historical: 1000 * 60 * 60 * 24, // 24 hours - historical data changes slowly
  recent: 1000 * 60 * 60,          // 1 hour - recent data (backend caches for 24h)
  realtime: 1000 * 60 * 30,        // 30 minutes - real-time data (backend caches for 24h)
  health: 1000 * 60 * 15,          // 15 minutes - health check
} as const;

/**
 * Hook for historical sentiment data (6 months)
 * Updates every hour as historical data changes slowly
 */
export function useHistoricalSentiment(): UseQueryResult<HistoricalSentimentResponse, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.historicalSentiment(),
    queryFn: dashboardApi.getHistoricalSentiment,
    staleTime: STALE_TIMES.historical,
    gcTime: STALE_TIMES.historical * 2, // Keep in cache for 2 hours
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for recent sentiment summary (last 7 days)
 * Updates every 15 minutes for more current data
 */
export function useRecentSentiment(): UseQueryResult<RecentSentimentResponse, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.recentSentiment(),
    queryFn: dashboardApi.getRecentSentiment,
    staleTime: STALE_TIMES.recent,
    gcTime: STALE_TIMES.recent * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for negative sentiment posts (complaints, outages, etc.)
 * Updates every 5 minutes for real-time monitoring
 */
export function useNegativePosts(): UseQueryResult<RedditOutageResponse, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.negativePosts(),
    queryFn: dashboardApi.getNegativePosts,
    staleTime: STALE_TIMES.realtime,
    gcTime: STALE_TIMES.realtime * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for positive sentiment posts (happiness, praise)
 * Updates every 5 minutes for real-time monitoring
 */
export function usePositivePosts(): UseQueryResult<RedditHappinessResponse, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.positivePosts(),
    queryFn: dashboardApi.getPositivePosts,
    staleTime: STALE_TIMES.realtime,
    gcTime: STALE_TIMES.realtime * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for combined sentiment analysis
 * Updates every 5 minutes for real-time overview
 */
export function useCombinedSentiment(): UseQueryResult<CombinedSentimentResponse, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.combinedSentiment(),
    queryFn: dashboardApi.getCombinedSentiment,
    staleTime: STALE_TIMES.realtime,
    gcTime: STALE_TIMES.realtime * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for API health check
 * Updates every 2 minutes to monitor API status
 */
export function useHealthCheck(): UseQueryResult<{ status: string; timestamp: string }, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.healthCheck(),
    queryFn: dashboardApi.getHealthCheck,
    staleTime: STALE_TIMES.health,
    gcTime: STALE_TIMES.health * 2,
    retry: 1, // Only retry once for health checks
    retryDelay: 5000,
  });
}

/**
 * Hook for recent social media posts from both Reddit and Twitter
 * Updates every 5 minutes for real-time social feed
 */
export function useRecentPosts(): UseQueryResult<RecentPostsResponse, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.recentPosts(),
    queryFn: () => dashboardApi.getCombinedRecentPostsFromBackend(10),
    staleTime: STALE_TIMES.realtime,
    gcTime: STALE_TIMES.realtime * 2,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Main dashboard hook that combines all dashboard data
 * This is the primary hook components should use
 */
export function useDashboard() {
  const historicalSentiment = useHistoricalSentiment();
  const recentSentiment = useRecentSentiment();
  const negativePosts = useNegativePosts();
  const positivePosts = usePositivePosts();
  const combinedSentiment = useCombinedSentiment();
  const healthCheck = useHealthCheck();
  const recentPosts = useRecentPosts();

  // Derived loading states
  const isLoading = historicalSentiment.isLoading || 
                   recentSentiment.isLoading || 
                   combinedSentiment.isLoading;

  const isError = historicalSentiment.isError || 
                 recentSentiment.isError || 
                 combinedSentiment.isError;

  const hasData = historicalSentiment.data && 
                  recentSentiment.data && 
                  combinedSentiment.data;

  // Aggregate errors
  const errors = [
    historicalSentiment.error,
    recentSentiment.error,
    negativePosts.error,
    positivePosts.error,
    combinedSentiment.error,
    healthCheck.error,
    recentPosts.error,
  ].filter(Boolean);

  // Computed dashboard summary
  const dashboardSummary = {
    // Network status based on health check and error states
    networkStatus: healthCheck.data?.status === 'ok' && !isError ? 'operational' : 'issues',
    
    // Overall sentiment from recent data
    overallSentiment: recentSentiment.data ? {
      ratio: recentSentiment.data.sentiment_ratio,
      score: recentSentiment.data.sentiment_score,
      trend: recentSentiment.data.sentiment_ratio > 0.6 ? 'positive' : 
             recentSentiment.data.sentiment_ratio < 0.4 ? 'negative' : 'neutral'
    } : null,
    
    // Quick stats
    quickStats: {
      recentPositive: recentSentiment.data?.positive_count || 0,
      recentNegative: recentSentiment.data?.negative_count || 0,
      totalPosts: recentSentiment.data?.total_posts || 0,
    },

    // Chart data for historical sentiment - only show if we have real data
    chartData: historicalSentiment.data?.monthly_data || [],
    
    // Last updated timestamp
    lastUpdated: new Date().toISOString(),
  };

  return {
    // Individual query results
    historicalSentiment,
    recentSentiment,
    negativePosts,
    positivePosts,
    combinedSentiment,
    healthCheck,
    recentPosts,
    
    // Aggregate states
    isLoading,
    isError,
    hasData,
    errors,
    
    // Computed dashboard data
    dashboardSummary,
    
    // Utility functions
    refetchAll: () => {
      historicalSentiment.refetch();
      recentSentiment.refetch();
      negativePosts.refetch();
      positivePosts.refetch();
      combinedSentiment.refetch();
      healthCheck.refetch();
      recentPosts.refetch();
    },
    
    // Check if any query is currently fetching
    isFetching: historicalSentiment.isFetching || 
               recentSentiment.isFetching || 
               negativePosts.isFetching || 
               positivePosts.isFetching || 
               combinedSentiment.isFetching || 
               healthCheck.isFetching ||
               recentPosts.isFetching,
  };
}

// Additional utility hooks for specific use cases

/**
 * Hook for just the data needed for the main sentiment chart
 */
export function useSentimentChart() {
  const { data, isLoading, error } = useHistoricalSentiment();
  
  return {
    chartData: data?.monthly_data || [],
    isLoading,
    error,
    overallStats: data?.overall_statistics,
  };
}

/**
 * Hook for just the quick stats cards
 */
export function useQuickStats() {
  const recent = useRecentSentiment();
  const health = useHealthCheck();
  
  return {
    networkStatus: health.data?.status === 'ok' ? 'Operational' : 'Issues Detected',
    sentimentScore: recent.data?.sentiment_score || 0,
    positivePosts: recent.data?.positive_count || 0,
    negativePosts: recent.data?.negative_count || 0,
    totalPosts: recent.data?.total_posts || 0,
    isLoading: recent.isLoading || health.isLoading,
    error: recent.error || health.error,
  };
}
