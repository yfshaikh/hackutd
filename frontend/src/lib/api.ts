// API utilities for fetching outage data

export interface OutageLocation {
  city: string;
  state: string;
  severity: 'high' | 'medium' | 'low';
}

export interface UserReport {
  username: string;
  comment: string;
  location: string;
  timestamp: string;
  issue_type: 'home_internet' | 'mobile_phone' | 'no_signal' | 'other';
}

export interface SocialMediaMention {
  platform: string;
  username: string;
  content: string;
  location: string;
  timestamp: string;
  issue_type: 'home_internet' | 'mobile_phone' | 'no_signal' | 'other';
}

export interface OutageData {
  timestamp: string;
  overall_status: string;
  most_reported_locations: OutageLocation[];
  problem_breakdown: Record<string, number>;
  user_reports: UserReport[];
  social_media_mentions: SocialMediaMention[];
  total_reports: number;
}

export interface MapMarker {
  id: string;
  position: [number, number]; // [lat, lng]
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  issue_type: 'home_internet' | 'mobile_phone' | 'no_signal' | 'other';
  source: 'reported_location' | 'user_report' | 'social_media';
  timestamp?: string;
}

// City coordinates mapping 
const CITY_COORDINATES: Record<string, [number, number]> = {
  'Houston': [29.7604, -95.3698],
  'Chicago': [41.8781, -87.6298],
  'Charlotte': [35.2271, -80.8431],
  'Seattle': [47.6062, -122.3321],
  'Denver': [39.7392, -104.9903],
  'Atlanta': [33.7490, -84.3880],
  'San Antonio': [29.4241, -98.4936],
  'Los Angeles': [34.0522, -118.2437],
  'Dallas': [32.7767, -96.7970],
  'Minneapolis': [44.9778, -93.2650],
  'Jacksonville': [30.3322, -81.6557],
  'New Hampshire': [43.4525, -71.5639],
  'Connecticut': [41.5978, -72.7554],
  'Michigan': [42.3314, -84.5467],
  'Florida': [27.7663, -82.6404],
  'Pennsylvania': [40.5908, -77.2098],
};

// ZIP code to coordinates (sample - in reality you'd use a geocoding service)  
const ZIP_COORDINATES: Record<string, [number, number]> = {
  '85209': [33.3062, -111.8413], // Mesa, AZ
  '92285': [33.6803, -116.1739], // Desert Hot Springs, CA
  '49271': [42.1917, -84.4391], // Pittsford, MI
  '63376': [38.9517, -90.7343], // St. Peters, MO
};

export async function fetchOutageData(): Promise<OutageData> {
  try {
    // Call the FastAPI backend to get live outage data
    const response = await fetch('http://localhost:8000/api/outages/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch outage data');
    }
    
    return result.data;
    
  } catch (error) {
    console.error('Failed to fetch outage data:', error);
    
    // Fallback to cached data if live fetch fails
    try {
      const cachedResponse = await fetch('http://localhost:8000/api/outages/cached', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (cachedResponse.ok) {
        const cachedResult = await cachedResponse.json();
        if (cachedResult.success) {
          console.log('Using cached outage data as fallback');
          return cachedResult.data;
        }
      }
    } catch (cachedError) {
      console.error('Failed to fetch cached data:', cachedError);
    }
    
    // If both live and cached fail, throw the original error
    throw error;
  }
}

export function convertOutageDataToMapMarkers(data: OutageData): MapMarker[] {
  const markers: MapMarker[] = [];

  // Add markers for most reported locations
  data.most_reported_locations.forEach((location, index) => {
    const cityKey = location.city;
    const coordinates = CITY_COORDINATES[cityKey];
    
    if (coordinates) {
      markers.push({
        id: `reported-${index}`,
        position: coordinates,
        title: `${location.city}${location.state ? ', ' + location.state : ''}`,
        description: `High activity area - Most reported location`,
        severity: location.severity,
        issue_type: 'other', // Mixed issues in most reported areas
        source: 'reported_location'
      });
    }
  });

  // Add markers for user reports
  data.user_reports.forEach((report, index) => {
    let coordinates: [number, number] | undefined;
    
    // Check if location is a ZIP code
    if (/^\d{5}$/.test(report.location)) {
      coordinates = ZIP_COORDINATES[report.location];
    } else {
      // Try to find city coordinates
      const locationKey = report.location.split(',')[0].trim();
      coordinates = CITY_COORDINATES[locationKey];
    }
    
    if (coordinates) {
      markers.push({
        id: `user-${index}`,
        position: coordinates,
        title: `User Report: ${report.location}`,
        description: report.comment.substring(0, 100) + (report.comment.length > 100 ? '...' : ''),
        severity: 'medium',
        issue_type: report.issue_type,
        source: 'user_report',
        timestamp: report.timestamp
      });
    }
  });

  // Add markers for social media mentions
  data.social_media_mentions.forEach((mention, index) => {
    let coordinates: [number, number] | undefined;
    
    // Check if location is a ZIP code  
    if (/^\d{5}$/.test(mention.location)) {
      coordinates = ZIP_COORDINATES[mention.location];
    } else {
      // Try to find city coordinates
      const locationKey = mention.location.split(',')[0].trim();
      coordinates = CITY_COORDINATES[locationKey];
    }
    
    if (coordinates) {
      markers.push({
        id: `social-${index}`,
        position: coordinates,
        title: `Social Media: ${mention.location}`,
        description: mention.content.substring(0, 100) + (mention.content.length > 100 ? '...' : ''),
        severity: 'low',
        issue_type: mention.issue_type,
        source: 'social_media',
        timestamp: mention.timestamp
      });
    }
  });

  return markers;
}

// Get marker color based on issue type
export function getMarkerColor(issueType: string, severity: string): string {
  const severityColors = {
    high: '#E53E3E',    // Red
    medium: '#F56500',  // Orange  
    low: '#ECC94B'      // Yellow
  };

  const typeColors = {
    home_internet: '#9F7AEA',  // Purple
    mobile_phone: '#E53E3E',   // Red
    no_signal: '#F56500',      // Orange
    other: '#718096'           // Gray
  };

  // Primary color by severity, fallback to issue type
  return severityColors[severity as keyof typeof severityColors] || 
         typeColors[issueType as keyof typeof typeColors] || 
         '#718096';
}
