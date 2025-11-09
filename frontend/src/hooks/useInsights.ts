/**
 * Insights Hook - TanStack Query hook for insights data management
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { insightsApi, type InsightsResponse } from '@/lib/api/insights';

// Query keys for consistent caching
export const insightsQueryKeys = {
  all: ['insights'] as const,
  trustpilot: () => [...insightsQueryKeys.all, 'trustpilot'] as const,
} as const;

// Stale time for insights data (in milliseconds)
const STALE_TIMES = {
  insights: 1000 * 60 * 30, // 30 minutes - insights data updates less frequently
} as const;

/**
 * Hook for Trustpilot insights data
 * Updates every 30 minutes as insights analysis is computationally expensive
 */
export function useInsights(): UseQueryResult<InsightsResponse, Error> {
  return useQuery({
    queryKey: insightsQueryKeys.trustpilot(),
    queryFn: insightsApi.getInsights,
    staleTime: STALE_TIMES.insights,
    gcTime: STALE_TIMES.insights * 2, // Keep in cache for 1 hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

