# Twitter/X API Integration - Quick Start

## ✅ What I Built

A complete Twitter/X API integration for T-Mobile sentiment analysis with **intelligent caching** to preserve your 100 free API reads per month.

## 📁 Files Created

1. **`twitter_utils/twitter_monitor.py`** - Twitter sentiment analysis with caching
2. **`routes/twitter_routes.py`** - API endpoints (similar to reddit_routes.py)
3. **`TWITTER_SETUP.md`** - Complete setup guide

## 🎯 Key Features

### ✨ Smart Caching System
- **24-hour cache** - Data refreshes automatically after 24 hours
- **Cache files**: `twitter_negative_cache.json` & `twitter_positive_cache.json`
- **Auto-fallback** - Uses stale cache if API fails
- **Manual refresh** - Force update when you need latest data

### 🚀 API Endpoints (Just Like Reddit!)

```bash
# Get negative sentiment tweets (USES CACHE BY DEFAULT)
GET /api/twitter/negative?use_cache=true&max_results=100

# Get positive sentiment tweets (USES CACHE BY DEFAULT)
GET /api/twitter/happiness?use_cache=true&max_results=100

# Get combined sentiment analysis (USES CACHE BY DEFAULT)
GET /api/twitter/sentiment?use_cache=true&max_results=100

# Check cache status (NO API USAGE)
GET /api/twitter/cache-status

# Force refresh cache (USES 1 API READ)
POST /api/twitter/refresh-cache?max_results=100

# Health check (NO API USAGE)
GET /api/twitter/health
```

## ⚡ Quick Setup

### 1. Install Tweepy
```bash
pip install tweepy
# Or if that fails:
pip3 install tweepy
```

### 2. Get Twitter Bearer Token
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a project and app
3. Get your **Bearer Token** from "Keys and Tokens"

### 3. Add to .env
```bash
# Add this line to your .env file
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### 4. Restart Server
```bash
# Your server should already be running with --reload
# It will auto-reload with the new routes
```

### 5. Initial Data Fetch (Uses 1 API Read)
```bash
curl -X POST "http://localhost:8000/api/twitter/refresh-cache?max_results=100"
```

### 6. Use Cached Data (Demo All Day!)
```bash
# This uses NO API quota - pulls from cache
curl "http://localhost:8000/api/twitter/sentiment?use_cache=true" | python3 -m json.tool
```

## 💡 How It Works

### First Call (No Cache)
```
User Request → Twitter API (uses 1 read) → Analyze Tweets → Save to Cache → Return Data
```

### Subsequent Calls (With Cache)
```
User Request → Check Cache (< 24hrs?) → Return Cached Data (no API usage!)
```

### After 24 Hours
```
User Request → Cache Expired → Twitter API (uses 1 read) → Update Cache → Return Data
```

## 📊 Cache Strategy

| Scenario | API Reads Used | Data Freshness |
|----------|----------------|----------------|
| First fetch | 1 | Real-time |
| Within 24hrs | 0 | Up to 24hrs old |
| After 24hrs | 1 (auto-refresh) | Real-time |
| Manual refresh | 1 | Real-time |
| API fails | 0 (stale cache) | May be old |

## 🎪 Perfect for Hackathons!

### Day 1 - Setup
```bash
# Fetch initial data (1 API read)
POST /refresh-cache

# Demo all day using cache (0 API reads)
GET /sentiment?use_cache=true  # ← Call this 1000 times, still 0 API reads!
```

### Day 2 - Fresh Data
```bash
# Fetch fresh data (1 API read)
POST /refresh-cache

# Demo all day using cache (0 API reads)
GET /sentiment?use_cache=true
```

**Total API usage for 2-day hackathon: 2 reads out of 100!** 🎉

## 🔄 Integration with Your Frontend

```typescript
// Fetch Twitter sentiment (uses cache)
const response = await fetch('http://localhost:8000/api/twitter/sentiment?use_cache=true');
const data = await response.json();

console.log(`Overall sentiment: ${data.overall_sentiment.sentiment_status}`);
console.log(`Positive tweets: ${data.overall_sentiment.positive_tweets}`);
console.log(`Negative tweets: ${data.overall_sentiment.negative_tweets}`);
console.log(`From cache: ${data.from_cache}`); // true = no API usage!
```

## 📝 Response Format

Similar to Reddit, returns:

```json
{
  "success": true,
  "from_cache": true,
  "timestamp": "2025-11-09T...",
  "overall_sentiment": {
    "overall_score": 0.65,
    "sentiment_status": "Positive",
    "total_tweets_analyzed": 23,
    "positive_tweets": 8,
    "negative_tweets": 15,
    "positive_ratio": 0.348
  },
  "negative_data": {
    "total_negative_posts": 15,
    "negative_posts": [...]
  },
  "happiness_data": {
    "total_positive_posts": 8,
    "average_happiness_score": 0.742,
    "happiness_posts": [...]
  },
  "engagement_summary": {
    "total_engagement": 1245,
    "negative_engagement": 780,
    "positive_engagement": 465,
    "engagement_ratio": 0.374
  }
}
```

## 🎯 Multi-Source Sentiment Dashboard

Now you have **3 data sources** for comprehensive sentiment analysis:

1. **Reddit** - Forums & discussions (real-time, no caching needed)
2. **Twitter** - Quick reactions & real-time updates (24hr cache, 100 reads/mo)
3. **Facebook** - Would need app review (not feasible for hackathon)

### Recommended Approach
Use **Reddit + Twitter** together for comprehensive coverage!

```bash
# Combine both sources
curl http://localhost:8000/api/reddit/sentiment
curl http://localhost:8000/api/twitter/sentiment?use_cache=true
```

## 🚨 Important Notes

1. **Always use `use_cache=true`** unless you need real-time data
2. **Free tier = 100 reads/month** - Cache helps you stay within limits
3. **Cache expires after 24 hours** - Automatically refreshes
4. **Manual refresh uses quota** - Only do this when necessary
5. **Check cache status** before manual refresh

## ✅ Testing Checklist

```bash
# 1. Install tweepy
pip install tweepy

# 2. Add TWITTER_BEARER_TOKEN to .env

# 3. Check health (no API usage)
curl http://localhost:8000/api/twitter/health

# 4. Fetch initial data (uses 1 API read)
curl -X POST http://localhost:8000/api/twitter/refresh-cache

# 5. Verify cache exists
curl http://localhost:8000/api/twitter/cache-status

# 6. Test endpoints with cache
curl "http://localhost:8000/api/twitter/negative?use_cache=true"
curl "http://localhost:8000/api/twitter/happiness?use_cache=true"
curl "http://localhost:8000/api/twitter/sentiment?use_cache=true"

# 7. Verify "from_cache": true in all responses
```

## 🎉 You're Done!

Your Twitter API integration is ready with intelligent caching to maximize your free API quota!

**Next Steps:**
1. Install tweepy: `pip install tweepy`
2. Add TWITTER_BEARER_TOKEN to .env
3. Test with: `curl http://localhost:8000/api/twitter/health`
4. Fetch initial data: `curl -X POST http://localhost:8000/api/twitter/refresh-cache`
5. Use cache for demos: `curl "http://localhost:8000/api/twitter/sentiment?use_cache=true"`

