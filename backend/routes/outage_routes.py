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
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

# Add the project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Create router
outage_router = APIRouter(prefix="/api/outages", tags=["outages"])

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
async def get_outages():
    """
    Get live T-Mobile outage data from DownDetector
    
    Returns structured outage data including:
    - Overall network status
    - Geographic hotspots  
    - Problem type breakdown
    - User reports with locations
    - Social media mentions
    """
    try:
        # Run the scraper to get fresh data
        scraper_path = os.path.join(project_root, 'scrape.py')
        
        result = await asyncio.create_subprocess_exec(
            'python', scraper_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=project_root
        )
        
        stdout, stderr = await result.communicate()
        
        if result.returncode == 0:
            # Read the saved JSON file
            json_file = os.path.join(project_root, 'latest_outage_data.json')
            
            if os.path.exists(json_file):
                with open(json_file, 'r') as f:
                    raw_data = json.load(f)
                
                # Process the data for frontend compatibility
                processed_data = process_outage_data(raw_data)
                
                return OutageResponse(
                    success=True,
                    data=processed_data,
                    last_updated=datetime.now().isoformat()
                )
            else:
                raise HTTPException(status_code=500, detail="No outage data file found")
        else:
            error_msg = stderr.decode() if stderr else "Scraper failed"
            raise HTTPException(status_code=500, detail=f"Scraper failed: {error_msg}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch outage data: {str(e)}")

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
