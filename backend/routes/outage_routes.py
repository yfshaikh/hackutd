"""
Outage Routes - HTTP API endpoints for T-Mobile outage data

This module provides REST API endpoints for real-time T-Mobile outage data:
- Live outage data from DownDetector
- Geographic outage mapping
- Issue type breakdown
- Social media sentiment analysis

Key Features:
- Real-time data scraping from DownDetector
- Structured JSON response with geographic data
- Error handling and data validation
- CORS support for frontend integration
"""

import os
import sys
import json
import asyncio
import subprocess
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

# Add the project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Create router
outage_router = APIRouter(prefix="/api/outages", tags=["outages"])

# Cache settings
CACHE_DURATION_HOURS = 24  # Cache outage data for 24 hours
CACHE_FILE = Path(project_root) / 'latest_outage_data.json'

def is_cache_valid() -> bool:
    """Check if cache file exists and is still valid"""
    if not CACHE_FILE.exists():
        return False
    
    try:
        with open(CACHE_FILE, 'r') as f:
            data = json.load(f)
        
        # Check if timestamp exists and is recent enough
        timestamp_str = data.get('timestamp')
        if not timestamp_str:
            return False
        
        cached_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        cache_age = datetime.now() - cached_time
        
        is_valid = cache_age.total_seconds() < (CACHE_DURATION_HOURS * 3600)
        
        if is_valid:
            hours_old = cache_age.total_seconds() / 3600
            print(f"📦 Cache is valid (age: {hours_old:.1f} hours)")
        else:
            print(f"⏰ Cache expired (age: {cache_age.total_seconds() / 3600:.1f} hours)")
        
        return is_valid
    except Exception as e:
        print(f"❌ Error checking cache validity: {e}")
        return False

# Pydantic models for response structure
class OutageLocation(BaseModel):
    city: str
    state: str
    severity: str

class UserReport(BaseModel):
    username: str
    comment: str
    location: str
    timestamp: str
    issue_type: str

class SocialMediaMention(BaseModel):
    platform: str
    username: str = ""
    content: str
    location: str
    timestamp: str
    issue_type: str

class OutageData(BaseModel):
    timestamp: str
    overall_status: str
    most_reported_locations: List[OutageLocation]
    problem_breakdown: Dict[str, int]
    user_reports: List[UserReport]
    social_media_mentions: List[SocialMediaMention]
    total_reports: int

class OutageResponse(BaseModel):
    success: bool
    data: Optional[OutageData] = None
    error: Optional[str] = None
    last_updated: str

@outage_router.get("/", response_model=OutageResponse)
async def get_outages(
    use_cache: bool = Query(default=True, description="Use cached data if available (recommended)")
):
    """
    Get live T-Mobile outage data from DownDetector
    
    Returns structured outage data including:
    - Overall network status
    - Geographic hotspots  
    - Problem type breakdown
    - User reports with locations
    - Social media mentions
    
    Flow:
    1. Check cache validity (24 hours) -> return if valid
    2. Run scraper to fetch fresh data
    3. Fall back to mock data if scraper fails
    
    Args:
        use_cache: If True, use cached data if valid (default: True)
    """
    try:
        # Step 1: Check if cache is valid and use_cache is enabled
        if use_cache and is_cache_valid():
            print("📦 Returning cached outage data")
            with open(CACHE_FILE, 'r') as f:
                raw_data = json.load(f)
            
            # Process the data for frontend compatibility
            processed_data = process_outage_data(raw_data)
            
            return OutageResponse(
                success=True,
                data=processed_data,
                last_updated=raw_data.get('timestamp', datetime.now().isoformat())
            )
        
        # Step 2: Try to run the scraper to get fresh data
        scraper_path = os.path.join(project_root, 'scrape.py')
        
        if not os.path.exists(scraper_path):
            print(f"⚠️  Scraper not found at {scraper_path}")
            # Check if we have stale cache to fall back on
            if CACHE_FILE.exists():
                print("📦 Using stale cache as fallback")
                with open(CACHE_FILE, 'r') as f:
                    raw_data = json.load(f)
                processed_data = process_outage_data(raw_data)
                return OutageResponse(
                    success=True,
                    data=processed_data,
                    last_updated=raw_data.get('timestamp', datetime.now().isoformat())
                )
            else:
                print("⚠️  No cache available, returning mock data")
                return OutageResponse(
                    success=True,
                    data=get_mock_outage_data(),
                    last_updated=datetime.now().isoformat()
                )
        
        print("🔍 Running scraper to fetch fresh outage data...")
        result = await asyncio.create_subprocess_exec(
            'python3', scraper_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=project_root
        )
        
        stdout, stderr = await result.communicate()
        
        if result.returncode == 0:
            print("✅ Scraper completed successfully")
            # Read the saved JSON file
            if CACHE_FILE.exists():
                with open(CACHE_FILE, 'r') as f:
                    raw_data = json.load(f)
                
                # Process the data for frontend compatibility
                processed_data = process_outage_data(raw_data)
                
                return OutageResponse(
                    success=True,
                    data=processed_data,
                    last_updated=raw_data.get('timestamp', datetime.now().isoformat())
                )
            else:
                print("⚠️  Scraper ran but no data file found")
                return OutageResponse(
                    success=True,
                    data=get_mock_outage_data(),
                    last_updated=datetime.now().isoformat()
                )
        else:
            error_msg = stderr.decode() if stderr else "Unknown error"
            print(f"❌ Scraper failed: {error_msg}")
            
            # Fall back to stale cache if available
            if CACHE_FILE.exists():
                print("📦 Using stale cache as fallback")
                with open(CACHE_FILE, 'r') as f:
                    raw_data = json.load(f)
                processed_data = process_outage_data(raw_data)
                return OutageResponse(
                    success=True,
                    data=processed_data,
                    last_updated=raw_data.get('timestamp', datetime.now().isoformat())
                )
            else:
                print("⚠️  No cache available, returning mock data")
                return OutageResponse(
                    success=True,
                    data=get_mock_outage_data(),
                    last_updated=datetime.now().isoformat()
                )
            
    except Exception as e:
        print(f"❌ Error in outages endpoint: {str(e)}")
        
        # Try to fall back to any cached data
        if CACHE_FILE.exists():
            print("📦 Using cached data as error fallback")
            try:
                with open(CACHE_FILE, 'r') as f:
                    raw_data = json.load(f)
                processed_data = process_outage_data(raw_data)
                return OutageResponse(
                    success=True,
                    data=processed_data,
                    last_updated=raw_data.get('timestamp', datetime.now().isoformat())
                )
            except:
                pass
        
        print("⚠️  Returning mock data")
        return OutageResponse(
            success=True,
            data=get_mock_outage_data(),
            last_updated=datetime.now().isoformat()
        )

@outage_router.get("/cached", response_model=OutageResponse) 
async def get_cached_outages():
    """
    Get cached outage data without running scraper
    
    Returns the last scraped data if available, useful for:
    - Faster responses
    - Avoiding rate limits
    - Development/testing
    """
    try:
        json_file = os.path.join(project_root, 'latest_outage_data.json')
        
        if os.path.exists(json_file):
            with open(json_file, 'r') as f:
                raw_data = json.load(f)
            
            # Process the data for frontend compatibility
            processed_data = process_outage_data(raw_data)
            
            return OutageResponse(
                success=True,
                data=processed_data,
                last_updated=raw_data.get('timestamp', datetime.now().isoformat())
            )
        else:
            raise HTTPException(status_code=404, detail="No cached outage data found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cached data: {str(e)}")

@outage_router.post("/refresh")
async def refresh_outage_data():
    """
    Manually trigger a fresh data scrape
    
    Useful for:
    - On-demand updates
    - Dashboard refresh buttons
    - Scheduled updates
    """
    try:
        # Run the scraper
        scraper_path = os.path.join(project_root, 'scrape.py')
        
        result = await asyncio.create_subprocess_exec(
            'python', scraper_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=project_root
        )
        
        stdout, stderr = await result.communicate()
        
        if result.returncode == 0:
            return {"success": True, "message": "Outage data refreshed successfully"}
        else:
            error_msg = stderr.decode() if stderr else "Scraper failed"
            raise HTTPException(status_code=500, detail=f"Refresh failed: {error_msg}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh data: {str(e)}")

def process_outage_data(raw_data: Dict[str, Any]) -> OutageData:
    """
    Process raw scraper data for frontend compatibility
    """
    # Process most reported locations
    most_reported_locations = []
    for location in raw_data.get("most_reported_locations", []):
        most_reported_locations.append(OutageLocation(
            city=location.get("city", ""),
            state=location.get("state", ""),
            severity="high"  # Most reported = high severity
        ))
    
    # Process user reports
    user_reports = []
    for report in raw_data.get("recent_user_reports", []):
        user_reports.append(UserReport(
            username="User Report",  # Anonymous for privacy
            comment=report.get("description", "")[:200] + ("..." if len(report.get("description", "")) > 200 else ""),
            location=report.get("location", ""),
            timestamp=report.get("timestamp", ""),
            issue_type=map_issue_type(report.get("issue_type", "other"))
        ))
    
    # Process social media mentions
    social_media_mentions = []
    for mention in raw_data.get("social_media_mentions", []):
        social_media_mentions.append(SocialMediaMention(
            platform=mention.get("platform", "twitter").lower(),
            username="",  # Keep anonymous
            content=mention.get("issue_description", "")[:200] + ("..." if len(mention.get("issue_description", "")) > 200 else ""),
            location=mention.get("location_mentioned", ""),
            timestamp=mention.get("timestamp", ""),
            issue_type=classify_social_issue(mention.get("issue_description", ""))
        ))
    
    # Normalize problem breakdown keys
    problem_breakdown = {}
    raw_breakdown = raw_data.get("problem_breakdown", {})
    
    for key, value in raw_breakdown.items():
        if "home_internet" in key.lower():
            problem_breakdown["home_internet"] = value
        elif "mobile_phone" in key.lower():
            problem_breakdown["mobile_phone"] = value  
        elif "no_signal" in key.lower():
            problem_breakdown["no_signal"] = value
        else:
            problem_breakdown["other"] = value
    
    return OutageData(
        timestamp=raw_data.get("timestamp", datetime.now().isoformat()),
        overall_status=raw_data.get("overall_status", "unknown"),
        most_reported_locations=most_reported_locations,
        problem_breakdown=problem_breakdown,
        user_reports=user_reports,
        social_media_mentions=social_media_mentions,
        total_reports=len(user_reports) + len(social_media_mentions)
    )

def map_issue_type(issue_type: str) -> str:
    """Map issue types to consistent format"""
    issue_type_lower = issue_type.lower()
    
    if "5g home internet" in issue_type_lower or "home internet" in issue_type_lower:
        return "home_internet"
    elif "mobile phone" in issue_type_lower or "phone" in issue_type_lower:
        return "mobile_phone"
    elif "no signal" in issue_type_lower or "signal" in issue_type_lower:
        return "no_signal"
    else:
        return "other"

def classify_social_issue(content: str) -> str:
    """Classify issue type from social media content"""
    content_lower = content.lower()
    
    if any(term in content_lower for term in ['home internet', '5g home', 'internet', 'wifi']):
        return 'home_internet'
    elif any(term in content_lower for term in ['mobile', 'phone', 'call', 'cellular']):
        return 'mobile_phone'  
    elif any(term in content_lower for term in ['no signal', 'signal', 'reception', 'coverage']):
        return 'no_signal'
    else:
        return 'other'

def get_mock_outage_data() -> OutageData:
    """Return mock outage data for demo purposes"""
    return OutageData(
        timestamp=datetime.now().isoformat(),
        overall_status="operational",
        most_reported_locations=[
            OutageLocation(city="New York", state="NY", severity="low"),
            OutageLocation(city="Los Angeles", state="CA", severity="low"),
            OutageLocation(city="Chicago", state="IL", severity="low")
        ],
        problem_breakdown={
            "mobile_phone": 2,
            "home_internet": 1,
            "no_signal": 1,
            "other": 1
        },
        user_reports=[
            UserReport(
                username="User Report",
                comment="Minor connectivity issue resolved quickly",
                location="New York, NY",
                timestamp=datetime.now().isoformat(),
                issue_type="mobile_phone"
            )
        ],
        social_media_mentions=[
            SocialMediaMention(
                platform="twitter",
                username="",
                content="T-Mobile service working great today!",
                location="Los Angeles, CA",
                timestamp=datetime.now().isoformat(),
                issue_type="other"
            )
        ],
        total_reports=2
    )
