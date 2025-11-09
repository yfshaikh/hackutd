import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, Users, Clock, MapPin, Wifi, Signal, Activity } from 'lucide-react'
import { useOutageData } from '@/hooks/useOutageData'
import type { OutageData } from '@/lib/api'

interface PriorityItem {
  id: string
  location: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  issueType: string
  reportCount: number
  impactScore: number
  estimatedUsers: number
  recommendedAction: string
  lastUpdated: string
}

function calculateImpactScore(severity: string, reportCount: number, issueType: string): number {
  // Base score from severity
  const severityScore = severity === 'high' ? 100 : severity === 'medium' ? 60 : 30
  
  // Issue type multiplier (critical services get higher priority)
  const issueMultiplier = {
    'no_signal': 1.5,        // No signal is critical
    'mobile_phone': 1.3,     // Mobile issues affect many
    'home_internet': 1.2,    // Home internet important
    'other': 1.0
  }
  
  const multiplier = issueMultiplier[issueType as keyof typeof issueMultiplier] || 1.0
  
  // Reports contribute to urgency (logarithmic scale)
  const reportScore = Math.log10(reportCount + 1) * 20
  
  return Math.round((severityScore + reportScore) * multiplier)
}

function getSeverityFromScore(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 150) return 'critical'
  if (score >= 100) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

function getRecommendedAction(issueType: string, reportCount: number): string {
  if (reportCount > 100) {
    return 'Deploy field technicians immediately'
  } else if (reportCount > 50) {
    return 'Escalate to regional operations center'
  } else if (reportCount > 20) {
    return 'Monitor and prepare response team'
  }
  
  switch (issueType) {
    case 'no_signal':
      return 'Check tower status and dispatch maintenance'
    case 'mobile_phone':
      return 'Investigate network congestion'
    case 'home_internet':
      return 'Review local fiber connections'
    default:
      return 'Continue monitoring situation'
  }
}

function processOutageDataToPriority(data: OutageData): PriorityItem[] {
  const items: PriorityItem[] = []
  const locationReports: Map<string, { count: number, issueTypes: Set<string>, severity: string }> = new Map()

  // Aggregate reports by location
  data.most_reported_locations.forEach(loc => {
    const key = `${loc.city}, ${loc.state}`
    locationReports.set(key, {
      count: 0,
      issueTypes: new Set(),
      severity: loc.severity
    })
  })

  // Count user reports by location
  data.user_reports.forEach(report => {
    if (locationReports.has(report.location)) {
      const loc = locationReports.get(report.location)!
      loc.count++
      loc.issueTypes.add(report.issue_type)
    } else {
      locationReports.set(report.location, {
        count: 1,
        issueTypes: new Set([report.issue_type]),
        severity: 'medium'
      })
    }
  })

  // Count social media mentions by location
  data.social_media_mentions.forEach(mention => {
    if (locationReports.has(mention.location)) {
      const loc = locationReports.get(mention.location)!
      loc.count++
      loc.issueTypes.add(mention.issue_type)
    } else {
      locationReports.set(mention.location, {
        count: 1,
        issueTypes: new Set([mention.issue_type]),
        severity: 'low'
      })
    }
  })

  // Create priority items
  locationReports.forEach((info, location) => {
    const primaryIssue = Array.from(info.issueTypes)[0] || 'other'
    const impactScore = calculateImpactScore(info.severity, info.count, primaryIssue)
    
    items.push({
      id: location,
      location,
      severity: getSeverityFromScore(impactScore),
      issueType: primaryIssue,
      reportCount: info.count,
      impactScore,
      estimatedUsers: info.count * 50, // Estimate 50 users per report
      recommendedAction: getRecommendedAction(primaryIssue, info.count),
      lastUpdated: data.timestamp
    })
  })

  // Sort by impact score (highest first)
  return items.sort((a, b) => b.impactScore - a.impactScore)
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-[hsl(var(--destructive))]'
    case 'high': return 'text-orange-500'
    case 'medium': return 'text-yellow-500'
    case 'low': return 'text-blue-500'
    default: return 'text-[hsl(var(--muted-foreground))]'
  }
}

function getSeverityBadgeVariant(severity: string): 'destructive' | 'default' | 'secondary' {
  switch (severity) {
    case 'critical': return 'destructive'
    case 'high': return 'destructive'
    case 'medium': return 'default'
    default: return 'secondary'
  }
}

function getIssueTypeIcon(issueType: string) {
  switch (issueType) {
    case 'home_internet': return <Wifi className="h-4 w-4" />
    case 'mobile_phone': return <Signal className="h-4 w-4" />
    case 'no_signal': return <AlertTriangle className="h-4 w-4" />
    default: return <Activity className="h-4 w-4" />
  }
}

function getIssueTypeLabel(issueType: string): string {
  switch (issueType) {
    case 'home_internet': return '5G Home Internet'
    case 'mobile_phone': return 'Mobile Phone'
    case 'no_signal': return 'No Signal'
    default: return 'Other Issues'
  }
}

export function PriorityQueue() {
  const { data: outageData, isLoading, error } = useOutageData()
  const navigate = useNavigate()

  const priorityItems = useMemo(() => {
    if (!outageData) return []
    return processOutageDataToPriority(outageData)
  }, [outageData])

  // Show top 10 items but make it scrollable
  const topItems = priorityItems.slice(0, 10)

  const handleItemClick = (item: PriorityItem) => {
    // Navigate to network map with location data
    navigate('/network-map', { 
      state: { 
        focusLocation: item.location,
        issueType: item.issueType
      } 
    })
  }

  if (isLoading) {
    return (
      <Card className="card-matte">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Priority Response Queue</CardTitle>
          <CardDescription className="text-xs">Loading affected areas...</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading priority data...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="card-matte">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Priority Response Queue</CardTitle>
          <CardDescription className="text-xs">Failed to load priority data</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <div className="text-sm text-red-500">Error loading data</div>
        </CardContent>
      </Card>
    )
  }

  if (topItems.length === 0) {
    return (
      <Card className="card-matte">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Priority Response Queue</CardTitle>
          <CardDescription className="text-xs">Areas requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--success))]" />
            <p className="text-sm font-medium">All Clear!</p>
            <p className="text-xs text-muted-foreground mt-1">No critical issues detected</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-matte">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Priority Response Queue</CardTitle>
            <CardDescription className="text-xs">Click to view on map</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {priorityItems.length} Incidents
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 h-[280px] overflow-y-auto pr-2">
          {topItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="p-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className={`mt-0.5 ${getSeverityColor(item.severity)}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">#{index + 1}</span>
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {item.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
                      <div className="flex items-center gap-1">
                        {getIssueTypeIcon(item.issueType)}
                        <span>{getIssueTypeLabel(item.issueType)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{item.reportCount} reports</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground line-clamp-1">
                        {item.recommendedAction}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3">
                  <Badge variant={getSeverityBadgeVariant(item.severity)} className="uppercase text-[10px] py-0 px-1.5">
                    {item.severity}
                  </Badge>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getSeverityColor(item.severity)}`}>
                      {item.impactScore}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {priorityItems.length > 10 && (
          <div className="mt-2 text-center text-xs text-muted-foreground">
            +{priorityItems.length - 10} more incidents in queue
          </div>
        )}
      </CardContent>
    </Card>
  )
}

