# Trustpilot T-Mobile Reviews Scraper

This directory contains scripts to scrape customer reviews from Trustpilot for T-Mobile.

## Available Scripts

### 1. **scrape_trustpilot.py** (Recommended)
Full-featured scraper using Selenium for dynamic content.

**Features:**
- Handles JavaScript-rendered content
- Supports pagination
- Extracts comprehensive review data
- More reliable for modern web pages

**Usage:**
```bash
python scrape_trustpilot.py
```

**Output:** `tmobile_trustpilot_reviews.json`

### 2. **scrape_trustpilot_simple.py**
Lightweight scraper using only requests and BeautifulSoup.

**Features:**
- No browser automation required
- Faster execution
- Lower resource usage
- May miss dynamically loaded content

**Usage:**
```bash
python scrape_trustpilot_simple.py
```

**Output:** `tmobile_trustpilot_reviews_simple.json`

## Installation

All required dependencies are in `requirements.txt`:

```bash
pip install -r requirements.txt
```

### Key Dependencies:
- `selenium` - For browser automation (scrape_trustpilot.py)
- `beautifulsoup4` - For HTML parsing
- `requests` - For HTTP requests (scrape_trustpilot_simple.py)
- `webdriver-manager` - For Chrome driver management

## Extracted Data

Both scripts extract the following information:

### Overall Statistics:
- TrustScore (overall rating)
- Total number of reviews
- Rating distribution (1-5 stars)

### Per Review:
- Reviewer name
- Location (if available)
- Star rating (1-5)
- Review date
- Verified purchase status
- Review title
- Review text
- Company response (if any)

## Output Format

```json
{
  "trustscore": 1.5,
  "total_reviews": 6469,
  "reviews_scraped": 100,
  "reviews": [
    {
      "reviewer_name": "John Doe",
      "location": "United States",
      "rating": 1,
      "date": "2025-11-09",
      "verified_purchase": false,
      "title": "Worst customer service ever",
      "review_text": "...",
      "company_response": "..."
    }
  ],
  "timestamp": "2025-11-09T10:30:00",
  "source_url": "https://www.trustpilot.com/review/www.t-mobile.com",
  "platform": "trustpilot"
}
```

## Configuration

### Adjust Number of Pages

In `scrape_trustpilot.py`:
```python
scrape_trustpilot_reviews(max_pages=5)  # Change number here
```

In `scrape_trustpilot_simple.py`:
```python
scrape_trustpilot_reviews_simple(max_pages=3)  # Change number here
```

### Headless Mode (Selenium version)

The Selenium scraper runs in headless mode by default. To see the browser:

```python
# In setup_driver() function, comment out:
# chrome_options.add_argument('--headless')
```

## Troubleshooting

### No Reviews Found

If the scraper doesn't find any reviews:

1. **Try the Selenium version** - `scrape_trustpilot.py` handles dynamic content better
2. **Check debug files** - Look at `trustpilot_debug_page.html` for the actual page structure
3. **Update selectors** - Website structure may have changed
4. **Check for blocking** - Site may be detecting and blocking scrapers

### Chrome Driver Issues

If you get Chrome driver errors:

```bash
# Install/update Chrome driver
pip install --upgrade webdriver-manager
```

Or install Chrome driver manually:
- Mac: `brew install chromedriver`
- Linux: `sudo apt-get install chromium-chromedriver`
- Windows: Download from https://chromedriver.chromium.org/

### Rate Limiting

If you're being rate-limited:
- Reduce `max_pages`
- Increase delay between pages (modify `time.sleep()` values)
- Use the simple version which is less detectable

## Best Practices

1. **Start with a few pages** - Test with `max_pages=2` first
2. **Be respectful** - Don't scrape too aggressively
3. **Check robots.txt** - Respect the site's scraping policies
4. **Handle errors** - Scripts include error handling and logging
5. **Save regularly** - Data is saved after completing all pages

## Comparison with Other Scrapers

| Feature | Trustpilot | ConsumerAffairs |
|---------|-----------|-----------------|
| Script | `scrape_trustpilot.py` | `scrape_reviews.py` |
| TrustScore | 1.5/5 | Higher ratings |
| Review Count | 6000+ | Varies |
| Structure | Modern JS | Mixed static/dynamic |
| Difficulty | Medium | Medium |

## Legal & Ethical Considerations

- ⚠️ **Check Terms of Service** - Scraping may violate Trustpilot's ToS
- ⚠️ **Respect robots.txt** - Follow crawling guidelines
- ⚠️ **Rate limiting** - Don't overwhelm the server
- ⚠️ **Data usage** - Use scraped data responsibly
- ⚠️ **Consider APIs** - Check if official API is available

## Support

For issues or questions:
1. Check the debug HTML files
2. Review console output for specific errors
3. Verify all dependencies are installed
4. Ensure Chrome browser is installed (for Selenium)

## Example Usage in Code

```python
# Import the scraper
from scrape_trustpilot import scrape_trustpilot_reviews

# Run scraper
data = scrape_trustpilot_reviews(max_pages=5)

# Access the data
if data:
    print(f"Scraped {data['reviews_scraped']} reviews")
    print(f"TrustScore: {data['trustscore']}")
    
    # Process reviews
    for review in data['reviews']:
        print(f"{review['reviewer_name']}: {review['rating']} stars")
        print(review['review_text'])
```

## Next Steps

After scraping:
1. Analyze sentiment of reviews
2. Identify common complaints/praise
3. Compare with other platforms (ConsumerAffairs, BBB)
4. Track changes over time
5. Generate insights for customer service improvements

