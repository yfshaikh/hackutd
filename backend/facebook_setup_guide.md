# Facebook API Setup Guide for T-Mobile Customer Happiness Index

This guide explains how to set up Facebook API integration for monitoring T-Mobile sentiment on Facebook pages and posts.

## 📋 Prerequisites

Before you can use the Facebook monitoring API, you need:

1. **Facebook Developer Account** - [Register here](https://developers.facebook.com/)
2. **Facebook App** - Create an app for accessing the Graph API
3. **Access Token** - Get permissions to read public page content

## 🚀 Quick Setup

### Step 1: Create a Facebook App

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as the app type
4. Fill in your app details:
   - **App Name**: "T-Mobile Sentiment Monitor"
   - **App Contact Email**: Your email
   - **Business Account**: Optional for testing

### Step 2: Configure App Permissions

1. In your app dashboard, go to "App Review" → "Permissions and Features"
2. Request these permissions:
   - `pages_read_engagement` - To read public page posts and engagement
   - `pages_show_list` - To access page information
   - `public_profile` - Basic profile information

### Step 3: Get Your Access Token

#### Option A: App Access Token (Recommended for monitoring pages)
```bash
# Get App Access Token (replace with your credentials)
curl -X GET "https://graph.facebook.com/oauth/access_token?client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&grant_type=client_credentials"
```

#### Option B: Page Access Token (For specific pages you manage)
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Click "Generate Access Token"
4. Select required permissions
5. Copy the generated token

### Step 4: Set Environment Variable

Add your Facebook access token to your environment:

```bash
# In your terminal or .env file
export FACEBOOK_ACCESS_TOKEN="your_facebook_access_token_here"
```

Or create a `.env` file in your backend directory:
```env
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token_here
```

## 🎯 Available API Endpoints

Once set up, you can use these endpoints:

### 1. Facebook Outage Detection
```bash
GET /api/facebook/outages?limit=25
```
- Monitors T-Mobile Facebook pages for outage reports
- Returns confidence scores and engagement metrics
- Includes likes, comments, and shares for each post

### 2. Facebook Happiness Index
```bash
GET /api/facebook/happiness?limit=25
```
- Analyzes positive sentiment from T-Mobile Facebook interactions
- Categories: service quality, speed, coverage, customer service, features
- Calculates engagement-weighted happiness scores

### 3. Combined Sentiment Analysis
```bash
GET /api/facebook/sentiment?limit=25
```
- Complete sentiment analysis combining outages and happiness
- Overall sentiment score with engagement weighting
- Sentiment classification (Very Positive → Very Negative)

### 4. Monitored Pages List
```bash
GET /api/facebook/pages
```
- Lists all T-Mobile Facebook pages being monitored
- Shows page statistics and accessibility status

### 5. Health Check
```bash
GET /api/facebook/health
```
- Tests Facebook API connectivity
- Verifies access token and permissions

## 🏢 Monitored Facebook Pages

The system automatically monitors these T-Mobile related pages:

- **T-Mobile** (`TMobile`) - Official T-Mobile page
- **T-Mobile Support** (`TMobileSupport`) - Customer support page  
- **Metro by T-Mobile** (`MetroByTMobile`) - Metro wireless service
- **Sprint** (`sprint`) - Sprint (now part of T-Mobile network)

## 📊 Response Format Example

### Outage Detection Response:
```json
{
  "success": true,
  "timestamp": "2024-01-09T10:30:00Z",
  "total_outage_posts": 5,
  "outages": [
    {
      "id": "TMobile_1234567890",
      "message": "We're experiencing network issues in the Dallas area...",
      "created_time": "2024-01-09T09:15:00Z",
      "page_name": "T-Mobile",
      "likes": 45,
      "comments": 23,
      "shares": 12,
      "url": "https://facebook.com/TMobile_1234567890",
      "confidence_score": 0.875,
      "keywords_found": ["network issues", "area", "service interruption"]
    }
  ]
}
```

### Happiness Analysis Response:
```json
{
  "success": true,
  "timestamp": "2024-01-09T10:30:00Z", 
  "total_positive_posts": 8,
  "average_happiness_score": 0.742,
  "happiness_posts": [
    {
      "id": "TMobile_9876543210",
      "message": "Amazing 5G speeds in downtown! Blazing fast internet...",
      "created_time": "2024-01-09T08:45:00Z",
      "page_name": "T-Mobile",
      "likes": 156,
      "comments": 34,
      "shares": 28,
      "url": "https://facebook.com/TMobile_9876543210", 
      "happiness_score": 0.891,
      "keywords_found": ["amazing", "blazing fast", "5g"]
    }
  ]
}
```

## 🔧 Testing Your Setup

1. **Start your API server**:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Test Facebook API health**:
   ```bash
   curl http://localhost:8000/api/facebook/health
   ```

3. **Test sentiment analysis**:
   ```bash
   curl http://localhost:8000/api/facebook/sentiment?limit=10
   ```

## ⚠️ Common Issues & Solutions

### Issue: "Invalid Access Token"
**Solution**: 
- Check that your `FACEBOOK_ACCESS_TOKEN` environment variable is set
- Verify the token hasn't expired (app tokens don't expire, user tokens do)
- Ensure your app has the required permissions

### Issue: "Cannot access page information"
**Solution**:
- Some pages may have restricted access
- Verify the page ID is correct
- Check if the page is public and accessible

### Issue: "Rate limit exceeded"
**Solution**:
- Facebook has rate limits (typically 200 calls per hour per user)
- Reduce the `limit` parameter in your requests
- Implement request caching for production use

### Issue: "Insufficient permissions"
**Solution**:
- Go to your Facebook App settings
- Request additional permissions: `pages_read_engagement`, `pages_show_list`
- For some features, you may need app review approval

## 🚀 Production Considerations

### Security
- Never commit access tokens to version control
- Use environment variables or secure key management
- Rotate access tokens regularly

### Rate Limiting
- Implement request caching to reduce API calls
- Use batch requests for multiple page monitoring
- Consider using webhooks for real-time updates

### Monitoring
- Set up logging for API errors and rate limits
- Monitor token expiration dates
- Track API usage against Facebook's limits

### Scaling
- For high-volume monitoring, consider Facebook's Business API
- Implement background job processing for large-scale analysis
- Use database caching for frequently accessed data

## 📚 Additional Resources

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
- [Facebook App Development Guide](https://developers.facebook.com/docs/app-development/)
- [Facebook Marketing API](https://developers.facebook.com/docs/marketing-api/) (for advanced features)
- [Facebook Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/) (for real-time updates)

## 🏆 Integration with T-Mobile Customer Happiness Index

This Facebook monitoring system seamlessly integrates with your T-Mobile Customer Happiness Index by:

✅ **Real-time sentiment streaming** from official T-Mobile Facebook pages
✅ **Engagement-weighted analysis** using likes, comments, and shares
✅ **Multi-source sentiment** combining Reddit and Facebook data
✅ **Official brand monitoring** from T-Mobile's direct communications
✅ **Customer interaction analysis** from comments and engagement
✅ **Issue escalation detection** from high-engagement negative posts

Perfect for the T-Mobile hackathon! 🎉
