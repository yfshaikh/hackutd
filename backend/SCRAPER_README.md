# T-Mobile Reviews Scraper

This directory contains scripts to scrape customer reviews from ConsumerAffairs for T-Mobile.

## ⭐ Recommended Approach

For the ConsumerAffairs T-Mobile reviews page, **use the Simple Scraper** (`scrape_reviews_simple.py`). It works reliably and doesn't require browser installation.

## Available Scrapers

### 1. Simple Requests-based Scraper (⭐ Recommended)
**File:** `scrape_reviews_simple.py`

A lightweight scraper using only `requests` and `BeautifulSoup`. **This is the best option for ConsumerAffairs.**

**Features:**
- ✅ No browser required
- ✅ Faster execution  
- ✅ Simpler dependencies
- ✅ **Works reliably for ConsumerAffairs**
- ✅ Successfully tested and verified

**Requirements:**
```bash
pip install requests beautifulsoup4
```

**Usage:**
```bash
cd backend
python scrape_reviews_simple.py
```

### 2. Selenium-based Scraper (Alternative)
**File:** `scrape_reviews.py`

This scraper uses Selenium WebDriver for sites with heavy JavaScript rendering.

**Features:**
- ✅ Handles JavaScript-rendered content
- ✅ Supports pagination (scrapes multiple pages)
- ✅ Good for dynamic websites
- ⚠️ May not work for all sites (some block headless browsers)

**Note:** For ConsumerAffairs specifically, this scraper has limitations as the site may block headless browsers. The simple scraper is more reliable for this use case.

**Requirements:**
```bash
pip install selenium beautifulsoup4 webdriver-manager
```

You also need Chrome browser installed on your system.

**Usage:**
```bash
cd backend
python scrape_reviews.py
```

**Configuration:**
You can adjust the number of pages to scrape by modifying the `max_pages` parameter in the script:
```python
scrape_tmobile_reviews(max_pages=5)  # Scrape 5 pages
```

## Output

Both scrapers generate a JSON file with the following structure:

```json
{
  "overall_rating": 1.5,
  "total_reviews": 9304,
  "rating_distribution": {
    "oneStar": 6644,
    "twoStar": 502,
    "threeStar": 179,
    "fourStar": 187,
    "fiveStar": 501
  },
  "reviews_scraped": 50,
  "reviews": [
    {
      "reviewer_name": "John Doe",
      "location": "New York, NY",
      "verified_purchase": true,
      "rating": 1,
      "date": "Nov. 8, 2025",
      "categories": ["Customer Service", "Coverage", "Price"],
      "review_text": "Review content here...",
      "helpful_votes": 5
    }
  ],
  "timestamp": "2025-11-09T12:00:00",
  "source_url": "https://www.consumeraffairs.com/cell_phones/tmobile_network.html"
}
```

## Extracted Data Fields

Each review contains:
- **reviewer_name**: Name of the reviewer
- **location**: City and state
- **verified_purchase**: Boolean indicating if purchase was verified
- **rating**: Star rating (1-5)
- **date**: Review date
- **categories**: Tags/categories mentioned (e.g., "Customer Service", "Coverage")
- **review_text**: Full review content
- **helpful_votes**: Number of helpful votes (if available)

## Quick Start (Recommended)

**For ConsumerAffairs T-Mobile reviews, use the simple scraper:**

```bash
cd backend

# Install dependencies
pip install requests beautifulsoup4

# Run the scraper
python scrape_reviews_simple.py
```

That's it! The scraper will extract reviews and save them to `tmobile_reviews_simple.json`.

## Full Installation (All Dependencies)

If you want to use both scrapers or work with other websites:

1. Install all dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. For the Selenium scraper, ensure Chrome is installed:
   - **Mac:** Install from [google.com/chrome](https://www.google.com/chrome)
   - **Linux:** `sudo apt-get install google-chrome-stable`
   - **Windows:** Download from [google.com/chrome](https://www.google.com/chrome)

## Troubleshooting

### Selenium Issues
If you get "ChromeDriver not found" error:
```bash
pip install webdriver-manager
```

The script will automatically download the correct ChromeDriver version.

### No Reviews Extracted
If the simple scraper returns 0 reviews:
- The content is likely JavaScript-rendered
- Use the Selenium-based scraper instead (`scrape_reviews.py`)

### Rate Limiting
If you're getting blocked:
- Add delays between page requests
- Reduce the number of pages scraped
- Use a VPN or proxy

## Ethical Considerations

⚠️ **Important:** Web scraping should be done responsibly:

1. **Respect robots.txt**: Check the site's robots.txt file
2. **Rate limiting**: Don't make too many requests too quickly
3. **Terms of Service**: Review the website's ToS
4. **Attribution**: Give credit to the data source
5. **Personal data**: Be careful with personal information

## Legal Notice

This scraper is for educational and research purposes. Users are responsible for ensuring their use complies with:
- The website's Terms of Service
- Applicable data protection laws (GDPR, CCPA, etc.)
- Copyright and intellectual property rights

## Support

For issues or questions:
1. Check if Chrome is installed and up to date
2. Verify all dependencies are installed
3. Try the simple scraper first to test connectivity
4. Check your internet connection
5. Verify the website structure hasn't changed

## Updates

The scraper may need updates if ConsumerAffairs changes their HTML structure. Check the selectors in the code if you're getting unexpected results.

