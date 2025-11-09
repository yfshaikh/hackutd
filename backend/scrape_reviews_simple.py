"""
Simple T-Mobile Reviews Scraper for ConsumerAffairs
This is a lightweight version using only requests and BeautifulSoup.
Note: May not capture all reviews if they're dynamically loaded.
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import re
import time

def scrape_tmobile_reviews_simple():
    """
    Simple scraper using requests only.
    Works well for static content but may miss dynamically loaded reviews.
    """
    print("🔍 Starting simple T-Mobile reviews scraper...")
    
    url = "https://www.consumeraffairs.com/cell_phones/tmobile_network.html"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
    }
    
    try:
        print(f"📄 Fetching page: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        print(f"✓ Page loaded successfully (status: {response.status_code})")
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract overall rating
        rating_elem = soup.find('meta', attrs={'itemprop': 'ratingValue'})
        overall_rating = float(rating_elem['content']) if rating_elem else None
        
        # Extract total reviews
        review_count_elem = soup.find('meta', attrs={'itemprop': 'reviewCount'})
        if review_count_elem:
            total_reviews = int(review_count_elem['content'])
        else:
            # Try alternative methods
            count_text = soup.find(string=re.compile(r'\d+,?\d*\s+reviews', re.IGNORECASE))
            if count_text:
                match = re.search(r'([\d,]+)\s+reviews', count_text, re.IGNORECASE)
                if match:
                    total_reviews = int(match.group(1).replace(',', ''))
                else:
                    total_reviews = None
            else:
                total_reviews = None
        
        # Extract rating distribution
        rating_distribution = {}
        star_labels = {1: 'oneStar', 2: 'twoStar', 3: 'threeStar', 4: 'fourStar', 5: 'fiveStar'}
        
        for star_num, label in star_labels.items():
            # Try multiple methods to find rating counts
            star_elem = soup.find('span', string=str(star_num))
            if star_elem:
                parent = star_elem.find_parent()
                if parent:
                    count_match = re.search(r'\((\d+)\)', parent.get_text())
                    if count_match:
                        rating_distribution[label] = int(count_match.group(1))
        
        print(f"\nOverall Rating: {overall_rating}/5")
        print(f"Total Reviews: {total_reviews}")
        print(f"Rating Distribution: {rating_distribution}\n")
        
        # Find all review containers
        reviews = []
        
        # Try multiple selectors
        review_containers = soup.find_all('div', attrs={'itemtype': 'http://schema.org/Review'})
        
        if not review_containers:
            # Try alternative selectors
            review_containers = soup.find_all('div', class_=re.compile('review', re.IGNORECASE))
        
        print(f"Found {len(review_containers)} review containers\n")
        
        for idx, container in enumerate(review_containers, 1):
            try:
                review = {}
                
                # Extract reviewer name and location
                author_elem = container.find('span', attrs={'itemprop': 'author'})
                if author_elem:
                    author_name = author_elem.find('span', attrs={'itemprop': 'name'})
                    if author_name:
                        full_text = author_name.get_text(strip=True)
                        if ',' in full_text:
                            parts = full_text.split(',', 1)
                            review['reviewer_name'] = parts[0].strip()
                            review['location'] = parts[1].strip()
                        else:
                            review['reviewer_name'] = full_text
                            review['location'] = None
                else:
                    # Try alternative selector
                    author_text = container.find(class_=re.compile('author|reviewer', re.IGNORECASE))
                    if author_text:
                        full_text = author_text.get_text(strip=True)
                        if ',' in full_text:
                            parts = full_text.split(',', 1)
                            review['reviewer_name'] = parts[0].strip()
                            review['location'] = parts[1].strip()
                        else:
                            review['reviewer_name'] = full_text
                
                # Check for verified purchase
                verified_elem = container.find(string=re.compile('Verified purchase', re.IGNORECASE))
                review['verified_purchase'] = verified_elem is not None
                
                # Extract rating
                rating_elem = container.find('meta', attrs={'itemprop': 'ratingValue'})
                if rating_elem and rating_elem.get('content'):
                    review['rating'] = int(float(rating_elem['content']))
                else:
                    # Try alternative methods
                    stars = container.find_all(class_=re.compile('star', re.IGNORECASE))
                    if stars:
                        review['rating'] = len([s for s in stars if 'filled' in s.get('class', [])])
                
                # Extract date
                date_elem = container.find('time', attrs={'itemprop': 'datePublished'})
                if date_elem:
                    review['date'] = date_elem.get_text(strip=True).replace('Reviewed ', '')
                else:
                    date_text = container.find(string=re.compile('Reviewed', re.IGNORECASE))
                    if date_text:
                        review['date'] = str(date_text).strip().replace('Reviewed ', '')
                
                # Extract category tags
                tags = []
                common_categories = ['Customer Service', 'Staff', 'Price', 'Contract & Terms', 
                                   'Coverage', 'Punctuality & Speed', 'Sales & Marketing', 
                                   'Installation & Setup', 'Ease of Use']
                
                for category in common_categories:
                    if container.find(string=re.compile(re.escape(category), re.IGNORECASE)):
                        tags.append(category)
                
                review['categories'] = tags
                
                # Extract review text
                review_body = container.find('div', attrs={'itemprop': 'reviewBody'})
                if not review_body:
                    review_body = container.find('div', class_=re.compile('review.*body|rvw.*bd', re.IGNORECASE))
                
                if review_body:
                    paragraphs = review_body.find_all('p')
                    if paragraphs:
                        review_text = ' '.join([p.get_text(strip=True) for p in paragraphs])
                    else:
                        review_text = review_body.get_text(strip=True)
                    
                    # Clean up excessive whitespace
                    review['review_text'] = ' '.join(review_text.split())
                
                # Extract helpful votes
                helpful_elem = container.find(string=re.compile('Thanks|Helpful', re.IGNORECASE))
                if helpful_elem:
                    helpful_match = re.search(r'(\d+)', str(helpful_elem))
                    if helpful_match:
                        review['helpful_votes'] = int(helpful_match.group(1))
                
                # Only add if we have essential data
                if review.get('reviewer_name') and review.get('review_text'):
                    reviews.append(review)
                    print(f"✓ [{idx}/{len(review_containers)}] Extracted review from {review['reviewer_name']}")
                elif review.get('review_text'):
                    review['reviewer_name'] = 'Anonymous'
                    reviews.append(review)
                    print(f"✓ [{idx}/{len(review_containers)}] Extracted anonymous review")
                
            except Exception as e:
                print(f"⚠️  [{idx}/{len(review_containers)}] Error parsing review: {e}")
                continue
        
        # Create structured data
        structured_data = {
            'overall_rating': overall_rating,
            'total_reviews': total_reviews,
            'rating_distribution': rating_distribution,
            'reviews_scraped': len(reviews),
            'reviews': reviews,
            'timestamp': datetime.now().isoformat(),
            'source_url': url,
            'scraper_type': 'simple'
        }
        
        print(f"\n✅ Successfully extracted {len(reviews)} reviews")
        
        if len(reviews) == 0:
            print("\n⚠️  WARNING: No reviews were extracted!")
            print("This might be because:")
            print("  1. The reviews are loaded dynamically with JavaScript")
            print("  2. The website structure has changed")
            print("  3. The site is blocking the scraper")
            print("\nTry using the Selenium-based scraper (scrape_reviews.py) instead.")
        
        # Save to file
        output_file = 'tmobile_reviews_simple.json'
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
    scrape_tmobile_reviews_simple()

