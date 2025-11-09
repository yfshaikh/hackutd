# 🚀 Quick Start: Trustpilot Scraper

## TL;DR - Get Started in 30 Seconds

```bash
# Navigate to backend directory
cd /Users/yusufshaikh/Desktop/Projects/hackutd/backend

# Option 1: Run the simple scraper (faster, lightweight)
python scrape_trustpilot_simple.py

# Option 2: Run the Selenium scraper (more reliable, handles JS)
python scrape_trustpilot.py
```

That's it! Your reviews will be saved to:
- `tmobile_trustpilot_reviews_simple.json` (Option 1)
- `tmobile_trustpilot_reviews.json` (Option 2)

---

## What Gets Scraped?

From: **https://www.trustpilot.com/review/www.t-mobile.com**

### Data Extracted:
✅ TrustScore (1.5/5 as of Nov 2025)  
✅ Total review count (6,469+)  
✅ Individual reviews with:
- Reviewer name & location
- Star rating (1-5)
- Review date
- Review title
- Full review text
- Verified purchase badge
- Company responses (if any)

---

## Which Scraper Should I Use?

### Use **scrape_trustpilot_simple.py** if:
- ✅ You want quick results
- ✅ You're testing/prototyping
- ✅ You want minimal dependencies
- ✅ The site works without JavaScript

### Use **scrape_trustpilot.py** if:
- ✅ Simple scraper isn't getting reviews
- ✅ You need pagination (multiple pages)
- ✅ The site heavily uses JavaScript
- ✅ You want more reliable scraping

---

## Example Output

```json
{
  "trustscore": 1.5,
  "total_reviews": 6469,
  "reviews_scraped": 60,
  "reviews": [
    {
      "reviewer_name": "Sharon Smith",
      "location": "US",
      "rating": 1,
      "date": "2025-11-05",
      "verified_purchase": false,
      "title": "After 18 years with this company...",
      "review_text": "I decided to switch to a carrier at almost half the cost...",
      "company_response": null
    },
    {
      "reviewer_name": "DragonLord",
      "rating": 1,
      "date": "2025-10-31",
      "title": "T-Mobile & Home Int.& T-money has become...",
      "review_text": "Nothing works right, you have to be available...",
      "verified_purchase": true
    }
  ],
  "timestamp": "2025-11-09T10:30:00",
  "source_url": "https://www.trustpilot.com/review/www.t-mobile.com",
  "platform": "trustpilot"
}
```

---

## Customize Your Scrape

### Change Number of Pages

**scrape_trustpilot_simple.py** (line 228):
```python
scrape_trustpilot_reviews_simple(max_pages=3)  # Change 3 to desired number
```

**scrape_trustpilot.py** (line 308):
```python
scrape_trustpilot_reviews(max_pages=5)  # Change 5 to desired number
```

### Run Selenium in Visible Mode (See the Browser)

In `scrape_trustpilot.py`, line 26:
```python
# Comment out this line to see the browser window
# chrome_options.add_argument('--headless')
```

---

## Common Issues & Fixes

### 1. "No module named 'selenium'"
```bash
pip install -r requirements.txt
```

### 2. "Chrome driver not found"
```bash
pip install webdriver-manager
# Or install manually:
# Mac: brew install chromedriver
# Linux: sudo apt-get install chromium-chromedriver
```

### 3. "No reviews found"
- ✅ Use `scrape_trustpilot.py` (Selenium version)
- ✅ Check `trustpilot_debug_page.html` for errors
- ✅ Trustpilot may have changed their HTML structure

### 4. "Connection timeout"
- ✅ Check your internet connection
- ✅ Trustpilot might be blocking your IP
- ✅ Try again after a few minutes

### 5. Script runs but extracts 0 reviews
- ✅ Trustpilot uses heavy JavaScript - use Selenium version
- ✅ Check if site structure changed
- ✅ Look at debug HTML file

---

## Use in Your Python Code

```python
# Import the function
from scrape_trustpilot import scrape_trustpilot_reviews

# Run the scraper
data = scrape_trustpilot_reviews(max_pages=3)

# Use the data
if data:
    print(f"✅ Scraped {data['reviews_scraped']} reviews")
    print(f"📊 TrustScore: {data['trustscore']}/5")
    
    # Analyze reviews
    one_star_reviews = [r for r in data['reviews'] if r['rating'] == 1]
    print(f"😞 {len(one_star_reviews)} one-star reviews")
    
    # Find common complaints
    for review in data['reviews'][:5]:
        print(f"\n{review['reviewer_name']}: {review['rating']}⭐")
        print(review['review_text'][:100] + "...")
```

---

## Integration with Your Backend

Add to your FastAPI routes (like the existing scrapers):

```python
# In routes/trustpilot_routes.py
from fastapi import APIRouter
from scrape_trustpilot import scrape_trustpilot_reviews

router = APIRouter()

@router.get("/trustpilot/reviews")
async def get_trustpilot_reviews():
    """Fetch latest Trustpilot reviews"""
    data = scrape_trustpilot_reviews(max_pages=2)
    return data
```

---

## Performance Tips

### Speed Up Scraping:
1. **Reduce pages**: Start with `max_pages=2`
2. **Use simple version**: Faster than Selenium
3. **Cache results**: Save and reuse JSON files

### Avoid Getting Blocked:
1. **Add delays**: Increase `time.sleep()` values
2. **Scrape fewer pages**: Don't be aggressive
3. **Use proxies**: Rotate IP addresses (advanced)
4. **Respect robots.txt**: Check site policies

---

## Next Steps

After scraping, you can:

1. **Sentiment Analysis**
   ```python
   # Analyze review sentiment
   negative_reviews = [r for r in data['reviews'] if r['rating'] <= 2]
   ```

2. **Compare Platforms**
   - Trustpilot (1.5★)
   - ConsumerAffairs (use `scrape_reviews.py`)
   - Reddit sentiment (already in your project!)

3. **Track Over Time**
   ```bash
   # Run daily and track changes
   python scrape_trustpilot.py
   mv tmobile_trustpilot_reviews.json reviews_$(date +%Y%m%d).json
   ```

4. **Create Visualizations**
   - Rating distribution charts
   - Word clouds of common terms
   - Timeline of reviews

---

## Files Created

| File | Purpose |
|------|---------|
| `scrape_trustpilot.py` | Main Selenium-based scraper |
| `scrape_trustpilot_simple.py` | Lightweight requests-based scraper |
| `README_TRUSTPILOT_SCRAPER.md` | Full documentation |
| `TRUSTPILOT_QUICK_START.md` | This guide |

---

## Need Help?

1. **Check debug files**: `trustpilot_debug_page.html`
2. **Read full docs**: `README_TRUSTPILOT_SCRAPER.md`
3. **Compare with existing scrapers**: `scrape_reviews.py`
4. **Verify dependencies**: `pip list | grep -E "selenium|beautifulsoup4|requests"`

---

## Legal Notice

⚠️ **Important**: Web scraping may violate Trustpilot's Terms of Service. This tool is for educational purposes. Always:
- Check the website's ToS
- Respect robots.txt
- Don't overload servers
- Use data responsibly

---

**Happy Scraping! 🎉**

