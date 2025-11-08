import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

// Sample data for T-Mobile network coverage areas
const networkData = {
  regions: [
    {
      id: 'northeast',
      name: 'Northeast Region',
      lat: 40.7128,
      lng: -74.0060,
      status: 'online',
      coverage: 98.5,
      issues: 2,
      color: '#22C55E'
    },
    {
      id: 'southeast',
      name: 'Southeast Region', 
      lat: 33.7490,
      lng: -84.3880,
      status: 'warning',
      coverage: 94.2,
      issues: 8,
      color: '#F59E0B'
    },
    {
      id: 'midwest',
      name: 'Midwest Region',
      lat: 41.8781,
      lng: -87.6298,
      status: 'online',
      coverage: 96.8,
      issues: 1,
      color: '#22C55E'
    },
    {
      id: 'southwest',
      name: 'Southwest Region',
      lat: 32.7767,
      lng: -96.7970,
      status: 'critical',
      coverage: 87.3,
      issues: 15,
      color: '#EF4444'
    },
    {
      id: 'west',
      name: 'West Region',
      lat: 34.0522,
      lng: -118.2437,
      status: 'online',
      coverage: 99.1,
      issues: 0,
      color: '#22C55E'
    }
  ]
}

export function NetworkMap() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22C55E'
      case 'warning': return '#F59E0B'
      case 'critical': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'warning': return 'Warning'
      case 'critical': return 'Critical'
      default: return 'Unknown'
    }
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Network Coverage Map</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Real-time network status
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95.2%</div>
            <p className="text-xs text-green-600">+0.3% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">26</div>
            <p className="text-xs text-red-600">+8 since yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regions Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3/5</div>
            <p className="text-xs text-yellow-600">2 regions need attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-green-600">-3ms improvement</p>
          </CardContent>
        </Card>
      </div>

      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>T-Mobile Network Coverage</CardTitle>
          <CardDescription>
            Interactive map showing real-time network status across all regions
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
              
              {networkData.regions.map((region) => (
                <CircleMarker
                  key={region.id}
                  center={[region.lat, region.lng]}
                  radius={30}
                  pathOptions={{
                    color: getStatusColor(region.status),
                    fillColor: getStatusColor(region.status),
                    fillOpacity: 0.6,
                    weight: 3
                  }}
                  eventHandlers={{
                    click: () => setSelectedRegion(region.id)
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold text-lg">{region.name}</h3>
                      <div className="mt-2 space-y-1">
                        <p><strong>Status:</strong> <span className={`font-medium ${
                          region.status === 'online' ? 'text-green-600' :
                          region.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`}>{getStatusText(region.status)}</span></p>
                        <p><strong>Coverage:</strong> {region.coverage}%</p>
                        <p><strong>Active Issues:</strong> {region.issues}</p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {selectedRegion && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Region Details</CardTitle>
            <CardDescription>
              Detailed information for selected region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Selected region: {networkData.regions.find(r => r.id === selectedRegion)?.name}
            </p>
            <p className="text-xs mt-2">
              Data integration pending - will show detailed metrics, customer sentiment, and issue breakdown
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}