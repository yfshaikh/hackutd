"""
Simple T-Mobile Trustpilot Reviews Scraper
This is a lightweight version using only requests and BeautifulSoup.
Note: May not capture all reviews if they're heavily dynamically loaded.
For better results, use the Selenium version (scrape_trustpilot.py).
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import re
import time

def scrape_trustpilot_reviews_simple(max_pages=3):
    """
    Simple scraper using requests only.
    Works for initial page load but may miss dynamically loaded content.
    """
    print("🔍 Starting simple Trustpilot T-Mobile reviews scraper...")
    print(f"Will attempt to scrape up to {max_pages} pages\n")
    
    base_url = "https://www.trustpilot.com/review/www.t-mobile.com"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
    }
    
    all_reviews = []
    stats = {}
    
    try:
        for page_num in range(1, max_pages + 1):
            # Construct URL for pagination
            if page_num == 1:
                url = base_url
            else:
                url = f"{base_url}?page={page_num}"
            
            print(f"\n📖 Scraping page {page_num}...")
            print(f"📄 Fetching: {url}")
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            print(f"✓ Page loaded successfully (status: {response.status_code})")
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # On first page, extract overall statistics
            if page_num == 1:
                # Extract TrustScore
                trustscore_elem = soup.find('p', attrs={'data-rating-typography': True})
                if not trustscore_elem:
                    trustscore_elem = soup.find(['span', 'p', 'div'], class_=re.compile('TrustScore|rating.*value', re.IGNORECASE))
                
                if trustscore_elem:
                    trustscore_text = trustscore_elem.get_text(strip=True)
                    match = re.search(r'(\d+\.?\d*)', trustscore_text)
                    if match:
                        stats['trustscore'] = float(match.group(1))
                
                # Extract total reviews
                review_count_elem = soup.find(['span', 'p'], attrs={'data-reviews-count-typography': True})
                if not review_count_elem:
                    review_count_elem = soup.find(string=re.compile(r'\d+[,\s]?\d*\s+reviews?', re.IGNORECASE))
                
                if review_count_elem:
                    count_text = str(review_count_elem) if isinstance(review_count_elem, str) else review_count_elem.get_text(strip=True)
                    match = re.search(r'([\d,]+)', count_text)
                    if match:
                        stats['total_reviews'] = int(match.group(1).replace(',', ''))
                
                print(f"\nTrustScore: {stats.get('trustscore', 'N/A')}/5")
                print(f"Total Reviews: {stats.get('total_reviews', 'N/A')}\n")
            
            # Find review cards
            review_cards = soup.find_all(['article', 'div'], attrs={'data-service-review-card-paper': True})
            
            # If no reviews found with data attribute, try class-based selector
            if not review_cards:
                review_cards = soup.find_all(['article', 'div'], class_=re.compile('review.*card|paper.*card', re.IGNORECASE))
            
            print(f"Found {len(review_cards)} review cards on page {page_num}")
            
            if len(review_cards) == 0 and page_num == 1:
                print("\n⚠️  WARNING: No reviews found on first page!")
                print("This might be because:")
                print("  1. Reviews are loaded dynamically with JavaScript")
                print("  2. The website structure has changed")
                print("  3. Trustpilot is blocking the scraper")
                print("\nTry using the Selenium-based scraper (scrape_trustpilot.py) instead.")
                break
            
            # Extract reviews from this page
            for idx, card in enumerate(review_cards, 1):
                try:
                    review = {}
                    
                    # Extract reviewer name
                    name_elem = card.find('span', attrs={'data-consumer-name-typography': True})
                    if not name_elem:
                        name_elem = card.find(['h3', 'h4', 'span'], class_=re.compile('consumer|reviewer|author', re.IGNORECASE))
                    
                    if name_elem:
                        review['reviewer_name'] = name_elem.get_text(strip=True)
                    
                    # Extract location
                    location_elem = card.find('div', attrs={'data-consumer-country-typography': True})
                    if location_elem:
                        review['location'] = location_elem.get_text(strip=True)
                    
                    # Extract rating
                    rating_elem = card.find('div', attrs={'data-service-review-rating': True})
                    if rating_elem:
                        img = rating_elem.find('img')
                        if img and img.get('alt'):
                            rating_text = img['alt']
                            match = re.search(r'(\d+)', rating_text)
                            if match:
                                review['rating'] = int(match.group(1))
                    
                    # Extract date
                    date_elem = card.find('time')
                    if date_elem:
                        if date_elem.get('datetime'):
                            review['date'] = date_elem['datetime']
                        else:
                            review['date'] = date_elem.get_text(strip=True)
                    
                    # Check for verified purchase
                    verified_elem = card.find(string=re.compile('Verified', re.IGNORECASE))
                    review['verified_purchase'] = verified_elem is not None
                    
                    # Extract review title
                    title_elem = card.find('h2', attrs={'data-service-review-title-typography': True})
                    if not title_elem:
                        title_elem = card.find(['h2', 'h3'], class_=re.compile('title|heading', re.IGNORECASE))
                    
                    if title_elem:
                        review['title'] = title_elem.get_text(strip=True)
                    
                    # Extract review text
                    text_elem = card.find('p', attrs={'data-service-review-text-typography': True})
                    if not text_elem:
                        text_elem = card.find('p', class_=re.compile('review.*text|review.*body', re.IGNORECASE))
                    
                    if text_elem:
                        review['review_text'] = text_elem.get_text(strip=True)
                    
                    # Extract company response if any
                    response_elem = card.find('div', class_=re.compile('reply|response', re.IGNORECASE))
                    if response_elem:
                        response_text_elem = response_elem.find('p')
                        if response_text_elem:
                            review['company_response'] = response_text_elem.get_text(strip=True)
                    
                    # Only add if we have essential data
                    if review.get('review_text'):
                        if not review.get('reviewer_name'):
                            review['reviewer_name'] = 'Anonymous'
                        all_reviews.append(review)
                        print(f"✓ [{idx}/{len(review_cards)}] Extracted review from {review['reviewer_name']}")
                    
                except Exception as e:
                    print(f"⚠️  [{idx}/{len(review_cards)}] Error parsing review: {e}")
                    continue
            
            print(f"Total reviews collected so far: {len(all_reviews)}")
            
            # Check if there are more pages
            if page_num < max_pages:
                # Look for next page link
                next_link = soup.find('a', attrs={'name': 'pagination-button-next'})
                if not next_link:
                    next_link = soup.find('a', class_=re.compile('next.*page', re.IGNORECASE))
                
                if not next_link:
                    print("\nNo next page link found - reached end of reviews")
                    break
                
                # Small delay to be respectful
                time.sleep(1)
        
        # Create structured data
        structured_data = {
            **stats,
            'reviews_scraped': len(all_reviews),
            'reviews': all_reviews,
            'timestamp': datetime.now().isoformat(),
            'source_url': base_url,
            'platform': 'trustpilot',
            'scraper_type': 'simple'
        }
        
        print(f"\n✅ Successfully extracted {len(all_reviews)} reviews")
        
        # Save to file
        output_file = 'tmobile_trustpilot_reviews_simple.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(structured_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Data saved to '{output_file}'")
        
        return structured_data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching page: {e}")
        return None
    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Scrape reviews (adjust max_pages as needed)
    scrape_trustpilot_reviews_simple(max_pages=20)

