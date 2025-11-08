import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchOutageData, type OutageData } from '../lib/api'

export const OUTAGE_DATA_QUERY_KEY = ['outageData']

export function useOutageData() {
  return useQuery({
    queryKey: OUTAGE_DATA_QUERY_KEY,
    queryFn: fetchOutageData,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

export function useRefreshOutageData() {
  const queryClient = useQueryClient()
  
  const refreshData = async () => {
    // Force refetch by invalidating the query
    await queryClient.invalidateQueries({ 
      queryKey: OUTAGE_DATA_QUERY_KEY 
    })
    
    // Optionally trigger a manual refetch
    await queryClient.refetchQueries({ 
      queryKey: OUTAGE_DATA_QUERY_KEY 
    })
  }
  
  return refreshData
}

export function useForceRefetchOutageData() {
  const queryClient = useQueryClient()
  
  const forceRefresh = async () => {
    // Force a fresh fetch by setting staleTime to 0 temporarily
    await queryClient.refetchQueries({ 
      queryKey: OUTAGE_DATA_QUERY_KEY,
      type: 'active'
    })
  }
  
  return forceRefresh
}

// Hook to get cached data without triggering a fetch
export function useCachedOutageData() {
  const queryClient = useQueryClient()
  
  const getCachedData = (): OutageData | undefined => {
    return queryClient.getQueryData(OUTAGE_DATA_QUERY_KEY)
  }
  
  const getCacheInfo = () => {
    const queryState = queryClient.getQueryState(OUTAGE_DATA_QUERY_KEY)
    return {
      isCached: !!queryState?.data,
      dataUpdatedAt: queryState?.dataUpdatedAt,
      isStale: queryState ? Date.now() - queryState.dataUpdatedAt > (1000 * 60 * 60) : true
    }
  }
  
  return {
    getCachedData,
    getCacheInfo
  }
}
