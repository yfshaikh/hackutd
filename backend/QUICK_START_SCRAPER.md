# Quick Start Guide - T-Mobile Review Scraper

## 🚀 Get Reviews in 3 Steps

### Step 1: Navigate to Backend Directory
```bash
cd /Users/yusufshaikh/Desktop/Projects/hackutd/backend
```

### Step 2: Install Dependencies (if not already installed)
```bash
pip install requests beautifulsoup4
```

### Step 3: Run the Scraper
```bash
python scrape_reviews_simple.py
```

**That's it!** ✨

## 📊 What You'll Get

After running the scraper, you'll find a file called `tmobile_reviews_simple.json` with:

- **10+ customer reviews** from the first page
- **Overall rating** (1.5/5 stars)
- **Total review count** (9,304 reviews)
- **Review details**: ratings, dates, categories, full text

## 📝 Sample Output

```json
{
  "overall_rating": 4.0,
  "total_reviews": 9304,
  "reviews_scraped": 10,
  "reviews": [
    {
      "reviewer_name": "Ray",
      "location": "New Orleans, LA",
      "rating": 4,
      "date": "Nov. 8, 2025",
      "categories": ["Customer Service", "Coverage", "Price"],
      "review_text": "T-Mobile. Honest assessment. I do have some background...",
      "verified_purchase": false
    },
    ...more reviews...
  ],
  "timestamp": "2025-11-09T...",
  "source_url": "https://www.consumeraffairs.com/cell_phones/tmobile_network.html"
}
```

## 🎯 Using the Data

### Load in Python
```python
import json

# Load the reviews
with open('tmobile_reviews_simple.json', 'r') as f:
    data = json.load(f)

# Access the data
print(f"Overall Rating: {data['overall_rating']}")
print(f"Total Reviews Available: {data['total_reviews']}")
print(f"Reviews Scraped: {data['reviews_scraped']}")

# Loop through reviews
for review in data['reviews']:
    print(f"\n⭐ {review['rating']}/5 - {review['reviewer_name']}")
    print(f"📅 {review['date']}")
    print(f"📝 {review['review_text'][:100]}...")
```

### Analyze Sentiment
```python
# Count by rating
from collections import Counter

ratings = [r['rating'] for r in data['reviews']]
rating_counts = Counter(ratings)

print("Rating Distribution:")
for rating in sorted(rating_counts.keys(), reverse=True):
    print(f"  {'⭐' * rating}: {rating_counts[rating]} reviews")
```

### Filter by Category
```python
# Find all reviews mentioning "Customer Service"
cs_reviews = [
    r for r in data['reviews'] 
    if 'Customer Service' in r.get('categories', [])
]

print(f"Found {len(cs_reviews)} reviews about Customer Service")
```

## ⚡ Advanced Usage

### Want More Reviews?

The simple scraper gets the first page (~10 reviews). To get more:

1. **Option A**: Run the scraper multiple times and modify the URL to include page numbers
2. **Option B**: Use the Selenium scraper (requires Chrome):
   ```bash
   python scrape_reviews.py
   ```

### Customize the Simple Scraper

Edit `scrape_reviews_simple.py` and modify:

```python
# Change URL to scrape different pages
url = "https://www.consumeraffairs.com/cell_phones/tmobile_network.html?page=2"

# Or scrape a different company
url = "https://www.consumeraffairs.com/cell_phones/verizon.html"
```

## 🔧 Troubleshooting

### "No module named 'requests'"
```bash
pip install requests beautifulsoup4
```

### "No module named 'bs4'"
```bash
pip install beautifulsoup4
```

### Script runs but extracts 0 reviews
- Check your internet connection
- The website structure may have changed
- Try running again (might be temporary)

### Want to see what's being scraped?
Add print statements to see progress:
```python
# In the script, find the loop and add:
for idx, review in enumerate(reviews, 1):
    print(f"Processing review {idx}...")
```

## 📞 Support

- **README**: See `SCRAPER_README.md` for detailed documentation
- **Summary**: See `SCRAPER_SUMMARY.md` for implementation details
- **Code**: Both scrapers are well-commented

## 🎓 Next Steps

1. ✅ Run the scraper to get reviews
2. ✅ Load and explore the JSON data
3. ✅ Integrate into your application
4. ✅ Set up automated scraping (optional)

### Integration Ideas

**Add to your FastAPI backend:**
```python
# In routes/review_routes.py
from fastapi import APIRouter
from scrape_reviews_simple import scrape_tmobile_reviews_simple

router = APIRouter()

@router.post("/api/scrape-reviews")
async def trigger_scrape():
    result = scrape_tmobile_reviews_simple()
    return {
        "success": True,
        "reviews_collected": result['reviews_scraped']
    }

@router.get("/api/reviews")
async def get_reviews():
    with open('tmobile_reviews_simple.json', 'r') as f:
        data = json.load(f)
    return data
```

**Display on frontend:**
```typescript
// In your React component
const fetchReviews = async () => {
  const response = await fetch('/api/reviews');
  const data = await response.json();
  setReviews(data.reviews);
};
```

---

**Happy Scraping!** 🎉

If you need help, check the other documentation files or modify the scripts to suit your needs.

