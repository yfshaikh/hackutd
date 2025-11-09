# Twitter/X API Setup Guide for T-Mobile Sentiment Analysis

## 🎯 Overview

The Twitter API integration provides sentiment analysis of user tweets about T-Mobile with intelligent caching to preserve your API quota (100 free reads per month).

## ✅ Features

- ✨ **Negative Sentiment Detection** - Finds complaints, outages, service issues
- 🎉 **Positive Sentiment Analysis** - Tracks customer satisfaction and praise
- 💾 **Intelligent 24-Hour Caching** - Preserves API quota automatically
- 📊 **Engagement Metrics** - Likes, retweets, replies tracking
- 🔄 **Auto-Fallback** - Uses stale cache if API fails
- 🎛️ **Manual Cache Refresh** - Force update when needed

## 🚀 Quick Setup

### Step 1: Get Twitter API Access

1. **Go to Twitter Developer Portal:**
   https://developer.twitter.com/en/portal/dashboard

2. **Create a Project and App:**
   - Click "Create Project"
   - Name it "T-Mobile Sentiment Monitor"
   - Create an App within the project
   
3. **Get Your Bearer Token:**
   - Go to your App settings
   - Click on "Keys and Tokens"
   - Generate/Copy the "Bearer Token"
   - **This is your TWITTER_BEARER_TOKEN**

### Step 2: Add Token to Environment

Add your bearer token to your `.env` file:

```bash
cd /Users/yusufshaikh/Desktop/Projects/hackutd/backend
nano .env  # or use your preferred editor
```

Add this line:

```env
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### Step 3: Install Dependencies

```bash
pip install tweepy
```

### Step 4: Test the Integration

```bash
# Start your server (if not already running)
uvicorn main:app --reload

# In another terminal, test the health endpoint
curl http://localhost:8000/api/twitter/health | python3 -m json.tool
```

## 📡 Available API Endpoints

### 1. Get Negative Sentiment Tweets

```bash
GET /api/twitter/negative?use_cache=true&max_results=100
```

**Parameters:**
- `use_cache` (bool, default: true) - Use cached data to save API quota
- `max_results` (int, 10-100, default: 100) - Max tweets if fetching fresh

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-09T...",
  "from_cache": true,
  "total_negative_posts": 15,
  "negative_posts": [
    {
      "id": "1234567890",
      "text": "T-Mobile service is down again...",
      "author_username": "frustrated_user",
      "author_name": "John Doe",
      "created_at": "2025-11-09T10:30:00",
      "likes": 45,
      "retweets": 12,
      "replies": 8,
      "url": "https://twitter.com/frustrated_user/status/1234567890",
      "confidence_score": 0.875,
      "keywords_found": ["down", "service down", "outage"]
    }
  ]
}
```

### 2. Get Positive Sentiment Tweets

```bash
GET /api/twitter/happiness?use_cache=true&max_results=100
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-09T...",
  "from_cache": true,
  "total_positive_posts": 8,
  "average_happiness_score": 0.742,
  "happiness_posts": [
    {
      "id": "9876543210",
      "text": "T-Mobile 5G is blazing fast! Love it!",
      "author_username": "happy_customer",
      "author_name": "Jane Smith",
      "created_at": "2025-11-09T09:15:00",
      "likes": 156,
      "retweets": 28,
      "replies": 12,
      "url": "https://twitter.com/happy_customer/status/9876543210",
      "happiness_score": 0.891,
      "keywords_found": ["blazing fast", "love", "5g"]
    }
  ]
}
```

### 3. Get Combined Sentiment Analysis

```bash
GET /api/twitter/sentiment?use_cache=true&max_results=100
```

Returns both negative and positive data plus overall metrics.

### 4. Check Cache Status

```bash
GET /api/twitter/cache-status
```

**Response:**
```json
{
  "success": true,
  "cache_duration_hours": 24,
  "negative_cache": {
    "valid": true,
    "exists": true,
    "cached_at": "2025-11-09T05:00:00",
    "expires_at": "2025-11-10T05:00:00",
    "total_posts": 15
  },
  "positive_cache": {
    "valid": true,
    "exists": true,
    "cached_at": "2025-11-09T05:00:00",
    "expires_at": "2025-11-10T05:00:00",
    "total_posts": 8
  },
  "recommendation": "Use cache=true to save API quota (100 free reads/month)"
}
```

### 5. Manually Refresh Cache

```bash
POST /api/twitter/refresh-cache?max_results=100
```

Forces a fresh API call to get latest tweets. **Uses API quota!**

### 6. Health Check

```bash
GET /api/twitter/health
```

Checks if Twitter API is configured. **Does NOT use API quota.**

## 💡 How Caching Works

### Automatic Caching
- First API call fetches 100 tweets from Twitter
- Data is saved to `twitter_negative_cache.json` and `twitter_positive_cache.json`
- Cache is valid for **24 hours**
- Subsequent calls use cache automatically (if `use_cache=true`)

### Cache Files Location
```
backend/
├── twitter_negative_cache.json  # Negative sentiment cache
└── twitter_positive_cache.json  # Positive sentiment cache
```

### API Quota Management
- **Free Tier:** 100 reads per month
- **One Search Call = 1 Read** (fetches both positive & negative)
- **Use cached data** to stay within limits
- **Manual refresh** when you need latest data

### Cache Expiration
- Cache expires after 24 hours
- Stale cache is used if API fails
- Manual refresh resets the 24-hour timer

## 🎯 Best Practices

### For Development
```bash
# Use cache to avoid hitting API limits
curl "http://localhost:8000/api/twitter/negative?use_cache=true"
```

### For Production
```bash
# Set up a cron job to refresh cache once per day
# This uses only 1 API read per day = 30 reads per month
0 6 * * * curl -X POST "http://localhost:8000/api/twitter/refresh-cache"
```

### For Demos
```bash
# Use cached data exclusively
# Only refresh manually when needed for latest data
curl "http://localhost:8000/api/twitter/sentiment?use_cache=true"
```

## 🧪 Testing Commands

```bash
# 1. Test health (no API usage)
curl http://localhost:8000/api/twitter/health | python3 -m json.tool

# 2. Check cache status (no API usage)
curl http://localhost:8000/api/twitter/cache-status | python3 -m json.tool

# 3. Get negative tweets (uses cache if available)
curl "http://localhost:8000/api/twitter/negative?use_cache=true" | python3 -m json.tool

# 4. Get positive tweets (uses cache if available)
curl "http://localhost:8000/api/twitter/happiness?use_cache=true" | python3 -m json.tool

# 5. Get combined sentiment (uses cache if available)
curl "http://localhost:8000/api/twitter/sentiment?use_cache=true" | python3 -m json.tool

# 6. Force refresh cache (USES API QUOTA!)
curl -X POST "http://localhost:8000/api/twitter/refresh-cache?max_results=100" | python3 -m json.tool
```

## ⚠️ API Limits & Quota

### Free Tier (Basic)
- **100 reads per month**
- **Search recent tweets** (last 7 days)
- **No historical data** beyond 7 days

### What Counts as a Read?
- Each search query = 1 read
- Our implementation uses 1 search to get both positive & negative

### How to Monitor Usage
1. Check Twitter Developer Portal dashboard
2. Use `/cache-status` endpoint to see when cache was last refreshed
3. Count manual `/refresh-cache` calls

## 🔧 Troubleshooting

### Error: "TWITTER_BEARER_TOKEN environment variable is not set"
**Solution:** Add your bearer token to `.env` file

### Error: "429 Too Many Requests"
**Solution:** You've hit the rate limit. Use cached data (`use_cache=true`)

### Error: "401 Unauthorized"
**Solution:** Your bearer token is invalid. Generate a new one from Twitter Developer Portal

### No tweets found
**Solution:** 
- This is normal - may not be many T-Mobile tweets in last 7 days
- Try manual refresh: `/refresh-cache`
- Check Twitter directly to verify tweets exist

### Cache not updating
**Solution:** 
- Cache updates every 24 hours automatically
- Force update: `POST /refresh-cache`
- Check cache status: `GET /cache-status`

## 📊 Data Sources Comparison

| Feature | Reddit | Twitter | Facebook |
|---------|--------|---------|----------|
| User Posts | ✅ Real-time | ✅ Real-time | ❌ Restricted |
| API Quota | ✅ Generous | ⚠️ Limited (100/mo) | ❌ Requires review |
| Caching | ❌ No | ✅ 24-hour | N/A |
| Historical Data | ✅ Unlimited | ⚠️ 7 days (free) | N/A |
| Best For | Forums/Discussions | Quick updates | N/A |

## 🎉 Quick Start Summary

```bash
# 1. Get Twitter Bearer Token from developer.twitter.com
# 2. Add to .env
echo "TWITTER_BEARER_TOKEN=your_token_here" >> .env

# 3. Install tweepy
pip install tweepy

# 4. Restart server
# (server will auto-reload if using --reload flag)

# 5. Fetch initial data (uses 1 API read)
curl -X POST "http://localhost:8000/api/twitter/refresh-cache?max_results=100"

# 6. Use cached data for all subsequent requests
curl "http://localhost:8000/api/twitter/sentiment?use_cache=true"
```

## 📚 Additional Resources

- [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Tweepy Documentation](https://docs.tweepy.org/)
- [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)

---

**Perfect for hackathons!** 🚀 Cache-first approach means you can demo all day using just 1-2 API calls!

