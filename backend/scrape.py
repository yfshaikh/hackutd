from firecrawl import Firecrawl
from dotenv import load_dotenv
import os 
import json

load_dotenv()

FIRECRAWL_API_KEY=os.getenv("FIRECRAWL_API_KEY")

firecrawl = Firecrawl(api_key=FIRECRAWL_API_KEY)

# Define the schema for structured data extraction
schema = {
    "type": "object",
    "properties": {
        "overall_status": {
            "type": "string",
            "description": "Current overall network status (e.g., 'no current problems' or 'outages reported')"
        },
        "most_reported_locations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"},
                    "state": {"type": "string"},
                    "severity": {"type": "string"}
                }
            },
            "description": "List of cities/locations with the most reported issues"
        },
        "problem_breakdown": {
            "type": "object",
            "properties": {
                "mobile_phone_percent": {"type": "number"},
                "home_internet_percent": {"type": "number"},
                "no_signal_percent": {"type": "number"},
                "other_percent": {"type": "number"}
            },
            "description": "Percentage breakdown of different types of reported problems"
        },
        "recent_user_reports": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "issue_type": {"type": "string"},
                    "description": {"type": "string"},
                    "timestamp": {"type": "string"}
                }
            },
            "description": "Recent user reports with location and issue details"
        },
        "social_media_mentions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "platform": {"type": "string"},
                    "location_mentioned": {"type": "string"},
                    "issue_description": {"type": "string"},
                    "timestamp": {"type": "string"}
                }
            },
            "description": "Social media reports mentioning specific locations and issues"
        }
    },
    "required": ["overall_status"]
}

print("🔍 Extracting structured data from DownDetector T-Mobile page...")

# Use extract() method for structured JSON data
result = firecrawl.extract(
    urls=["https://downdetector.com/status/t-mobile/"],
    schema=schema,
    prompt="""Extract T-Mobile outage and service issue data from this DownDetector page. Focus on:

1. Overall network status (look for phrases like "no current problems" or "outages reported")

2. Most reported locations section - extract city names and states where issues are concentrated

3. Problem breakdown percentages - look for percentages of different issue types like:
   - Mobile Phone issues
   - 5G Home Internet issues  
   - No Signal issues
   - Other connectivity problems

4. Recent user reports/comments that mention specific locations, cities, states, or ZIP codes along with their issues

5. Social media mentions (Twitter/X posts) that reference specific geographic areas with T-Mobile problems

Pay special attention to any geographic references (cities, states, regions, ZIP codes) and the types of service issues reported in those areas. This data will be used to create a geographic outage map."""
)

if result and result.data:
    print("=== STRUCTURED OUTAGE DATA (Direct JSON) ===")
    structured_data = result.data[0] if isinstance(result.data, list) else result.data
    
    # Add current timestamp
    from datetime import datetime
    structured_data['timestamp'] = datetime.now().isoformat()
    
    print(json.dumps(structured_data, indent=2))
    
    # Save to file
    with open('latest_outage_data.json', 'w') as f:
        json.dump(structured_data, f, indent=2)
    print("\n💾 Data saved to 'latest_outage_data.json'")
    print(f"⏰ Timestamp: {structured_data['timestamp']}")
    
else:
    print("❌ Failed to extract structured data")
    print("Raw response:", result)