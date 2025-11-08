import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Wifi, Signal, Users, RefreshCw } from 'lucide-react'
import { convertOutageDataToMapMarkers, getMarkerColor } from '../lib/api'
import { useOutageData, useForceRefetchOutageData, useCachedOutageData } from '../hooks/useOutageData'

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

export function NetworkMap() {
  const { data: outageData, isLoading, error, isFetching, dataUpdatedAt } = useOutageData()
  const forceRefresh = useForceRefetchOutageData()
  const { getCacheInfo } = useCachedOutageData()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Memoize map markers to avoid recalculation on every render
  const mapMarkers = useMemo(() => {
    return outageData ? convertOutageDataToMapMarkers(outageData) : []
  }, [outageData])

  // Get cache information
  const cacheInfo = getCacheInfo()

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await forceRefresh()
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType) {
      case 'home_internet': return <Wifi className="h-4 w-4" />
      case 'mobile_phone': return <Signal className="h-4 w-4" />
      case 'no_signal': return <AlertTriangle className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getIssueTypeLabel = (issueType: string) => {
    switch (issueType) {
      case 'home_internet': return '5G Home Internet'
      case 'mobile_phone': return 'Mobile Phone'
      case 'no_signal': return 'No Signal'
      default: return 'Other Issues'
    }
  }

  const getSeverityBadge = (severity: string, source: string) => {
    const variant = severity === 'high' ? 'destructive' : 
                   severity === 'medium' ? 'default' : 
                   'secondary'
    
    const label = source === 'reported_location' ? 'High Activity' :
                  source === 'user_report' ? 'User Report' :
                  'Social Media'
    
    return <Badge variant={variant}>{label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading outage data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2">Failed to load outage data</span>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!outageData) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-96">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2">No outage data available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">T-Mobile Outage Map</h2>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end">
            <span className="text-sm text-muted-foreground">
              Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'Unknown'}
            </span>
            {cacheInfo.isCached && (
              <span className="text-xs text-muted-foreground">
                {cacheInfo.isStale ? 'Cache stale' : 'Cached'} • {isFetching && 'Updating...'}
              </span>
            )}
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing || isFetching}
            variant="outline"
            size="sm"
          >
            {isRefreshing || isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {outageData.overall_status.replace('_', ' ')}
            </div>
            <p className="text-xs text-green-600">System monitoring active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outageData.total_reports}</div>
            <p className="text-xs text-blue-600">
              {outageData.user_reports.length} user + {outageData.social_media_mentions.length} social
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hot Spots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outageData.most_reported_locations.length}</div>
            <p className="text-xs text-orange-600">High activity areas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...Object.values(outageData.problem_breakdown))}%
            </div>
            <p className="text-xs text-purple-600">5G Home Internet</p>
          </CardContent>
        </Card>
      </div>

      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Live Outage Reports</CardTitle>
          <CardDescription>
            Real-time data from DownDetector showing T-Mobile service issues across the US
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] w-full">
            <MapContainer
              center={[39.8283, -98.5795]} // Center of US
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {mapMarkers.map((marker) => (
                <CircleMarker
                  key={marker.id}
                  center={marker.position}
                  radius={marker.severity === 'high' ? 25 : marker.severity === 'medium' ? 20 : 15}
                  pathOptions={{
                    color: getMarkerColor(marker.issue_type, marker.severity),
                    fillColor: getMarkerColor(marker.issue_type, marker.severity),
                    fillOpacity: 0.7,
                    weight: 2
                  }}
                  eventHandlers={{
                    click: () => {}
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-[250px]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{marker.title}</h3>
                        {getSeverityBadge(marker.severity, marker.source)}
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          {getIssueTypeIcon(marker.issue_type)}
                          <span className="text-sm font-medium">
                            {getIssueTypeLabel(marker.issue_type)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          {marker.description}
                        </p>
                        
                        {marker.timestamp && (
                          <p className="text-xs text-gray-500">
                            Reported: {new Date(marker.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Problem Breakdown Card */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Issue Breakdown</CardTitle>
          <CardDescription>
            Current distribution of reported problems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(outageData.problem_breakdown).map(([type, percentage]) => (
              <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <div className="flex items-center gap-2">
                  {getIssueTypeIcon(type)}
                  <span className="font-medium capitalize">
                    {type.replace('_', ' ').replace('5g', '5G')}
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {percentage}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map Legend */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Map Legend</CardTitle>
          <CardDescription>
            Understanding the outage markers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">By Source</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">High Activity Areas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span className="text-sm">User Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Social Media</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">By Issue Type</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">5G Home Internet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Signal className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Mobile Phone</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">No Signal</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}