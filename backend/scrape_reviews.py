"""
T-Mobile Reviews Scraper for ConsumerAffairs
This script scrapes customer reviews from ConsumerAffairs T-Mobile page.
Uses Selenium for dynamic content loading and supports pagination.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time
import re

def setup_driver():
    """Setup and configure Chrome driver"""
    import tempfile
    import os
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # Run in background
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Create unique user data directory to avoid conflicts
    temp_dir = tempfile.mkdtemp()
    chrome_options.add_argument(f'--user-data-dir={temp_dir}')
    
    # Add more stability options
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-infobars')
    chrome_options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def extract_reviews_from_page(driver):
    """Extract all reviews from the current page"""
    reviews = []
    
    # Wait for page to fully load
    try:
        # Try multiple selectors to wait for reviews
        selectors_to_try = [
            "div[itemtype*='Review']",
            ".rvw",
            "[class*='review']",
            "article"
        ]
        
        loaded = False
        for selector in selectors_to_try:
            try:
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                loaded = True
                print(f"✓ Page loaded with selector: {selector}")
                break
            except TimeoutException:
                continue
        
        if not loaded:
            print("⚠️  Timeout waiting for reviews to load with any selector")
            # Continue anyway, might still find reviews in the page source
    except Exception as e:
        print(f"⚠️  Error waiting for page load: {e}")
    
        # Get page source and parse with BeautifulSoup
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    # Find all review containers using multiple approaches
    review_containers = soup.find_all('div', attrs={'itemtype': 'http://schema.org/Review'})
    
    if not review_containers:
        # Try alternative selectors
        review_containers = soup.find_all('div', attrs={'itemtype': re.compile('Review', re.IGNORECASE)})
    
    if not review_containers:
        # Try class-based selector
        review_containers = soup.find_all('div', class_=re.compile('review', re.IGNORECASE))
    
    print(f"Found {len(review_containers)} reviews on current page")
    
    # Debug: Save page source if no reviews found
    if len(review_containers) == 0:
        debug_file = 'selenium_debug_page.html'
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        print(f"⚠️  No reviews found. Page source saved to '{debug_file}' for debugging")
    
    for container in review_containers:
        try:
            review = {}
            
            # Extract reviewer name and location
            author_elem = container.find('span', attrs={'itemprop': 'author'})
            if author_elem:
                author_name = author_elem.find('span', attrs={'itemprop': 'name'})
                if author_name:
                    full_text = author_name.get_text(strip=True)
                    # Try to split by comma for location
                    if ',' in full_text:
                        parts = full_text.split(',', 1)
                        review['reviewer_name'] = parts[0].strip()
                        review['location'] = parts[1].strip()
                    else:
                        review['reviewer_name'] = full_text
                        review['location'] = None
            
            # Check for verified purchase
            verified_elem = container.find(string=re.compile('Verified purchase', re.IGNORECASE))
            review['verified_purchase'] = verified_elem is not None
            
            # Extract rating
            rating_elem = container.find('meta', attrs={'itemprop': 'ratingValue'})
            if rating_elem and rating_elem.get('content'):
                review['rating'] = int(float(rating_elem['content']))
            
            # Extract date
            date_elem = container.find('time', attrs={'itemprop': 'datePublished'})
            if not date_elem:
                # Try alternative selector
                date_elem = container.find(string=re.compile('Reviewed'))
                if date_elem:
                    review['date'] = date_elem.strip().replace('Reviewed ', '')
            else:
                review['date'] = date_elem.get_text(strip=True).replace('Reviewed ', '')
            
            # Extract category tags (popular mentions)
            tags = []
            # Look for tags/categories in various possible locations
            tag_containers = container.find_all(['span', 'a'], class_=re.compile('tag|category|mention', re.IGNORECASE))
            for tag in tag_containers:
                tag_text = tag.get_text(strip=True)
                if tag_text and len(tag_text) < 50:  # Avoid long text
                    tags.append(tag_text)
            
            # Also try finding by common category names
            common_categories = ['Customer Service', 'Staff', 'Price', 'Contract & Terms', 
                               'Coverage', 'Punctuality & Speed', 'Sales & Marketing', 
                               'Installation & Setup', 'Ease of Use']
            for category in common_categories:
                if container.find(string=re.compile(category, re.IGNORECASE)):
                    if category not in tags:
                        tags.append(category)
            
            review['categories'] = tags
            
            # Extract review text
            review_body = container.find('div', attrs={'itemprop': 'reviewBody'})
            if not review_body:
                # Try alternative selector
                review_body = container.find('div', class_=re.compile('review.*body|rvw.*bd', re.IGNORECASE))
            
            if review_body:
                # Get all paragraphs
                paragraphs = review_body.find_all('p')
                if paragraphs:
                    review_text = ' '.join([p.get_text(strip=True) for p in paragraphs])
                else:
                    review_text = review_body.get_text(strip=True)
                
                # Clean up the text
                review['review_text'] = review_text
            
            # Extract helpful votes if available
            helpful_elem = container.find(string=re.compile('Thanks|Helpful', re.IGNORECASE))
            if helpful_elem:
                helpful_match = re.search(r'(\d+)', helpful_elem)
                if helpful_match:
                    review['helpful_votes'] = int(helpful_match.group(1))
            
            # Only add if we have essential data
            if review.get('reviewer_name') and review.get('review_text'):
                reviews.append(review)
                print(f"✓ Extracted review from {review['reviewer_name']}")
            
        except Exception as e:
            print(f"⚠️  Error parsing review: {e}")
            continue
    
    return reviews

def scrape_tmobile_reviews(max_pages=5, debug=False):
    """Main scraping function"""
    print("🔍 Starting T-Mobile reviews scraper...")
    print(f"Will attempt to scrape up to {max_pages} pages\n")
    
    url = "https://www.consumeraffairs.com/cell_phones/tmobile_network.html"
    
    driver = setup_driver()
    all_reviews = []
    
    try:
        # Load initial page
        driver.get(url)
        print(f"📄 Loading page: {url}")
        
        # Wait for page to load and JavaScript to render
        time.sleep(5)  # Increased wait time
        
        # Scroll down to trigger lazy loading if any
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        
        # Extract overall rating and total reviews
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Overall rating
        rating_elem = soup.find('meta', attrs={'itemprop': 'ratingValue'})
        overall_rating = float(rating_elem['content']) if rating_elem else None
        
        # Total reviews
        review_count_elem = soup.find('meta', attrs={'itemprop': 'reviewCount'})
        if review_count_elem:
            total_reviews = int(review_count_elem['content'])
        else:
            # Try to find in text
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
        for star in range(1, 6):
            star_elem = soup.find('span', string=str(star))
            if star_elem:
                parent = star_elem.find_parent()
                if parent:
                    count_match = re.search(r'\((\d+)\)', parent.get_text())
                    if count_match:
                        rating_distribution[f'{star}_star'] = int(count_match.group(1))
        
        print(f"Overall Rating: {overall_rating}/5")
        print(f"Total Reviews: {total_reviews}")
        print(f"Rating Distribution: {rating_distribution}\n")
        
        # Scrape reviews from multiple pages
        for page_num in range(1, max_pages + 1):
            print(f"\n📖 Scraping page {page_num}...")
            
            # Extract reviews from current page
            page_reviews = extract_reviews_from_page(driver)
            all_reviews.extend(page_reviews)
            
            print(f"Total reviews collected so far: {len(all_reviews)}")
            
            # Try to find and click next page button
            if page_num < max_pages:
                try:
                    # Look for next page button using multiple strategies
                    next_button = None
                    
                    # Try different selectors
                    selectors = [
                        "a[rel='next']",
                        ".pagination__next",
                        "a.next",
                        "button.next",
                        "//a[contains(text(), 'Next')]",
                        "//button[contains(text(), 'Next')]",
                        "//a[@aria-label='Next']",
                    ]
                    
                    for selector in selectors:
                        try:
                            if selector.startswith("//"):
                                # XPath selector
                                next_button = driver.find_element(By.XPATH, selector)
                            else:
                                # CSS selector
                                next_button = driver.find_element(By.CSS_SELECTOR, selector)
                            
                            if next_button and next_button.is_displayed() and next_button.is_enabled():
                                print(f"➡️  Found next button with selector: {selector}")
                                next_button.click()
                                time.sleep(3)  # Wait for page to load
                                break
                        except NoSuchElementException:
                            continue
                    
                    if not next_button:
                        print("No next page button found - reached end of reviews")
                        break
                        
                except Exception as e:
                    print(f"Error navigating to next page: {e}")
                    break
        
        # Create structured data
        structured_data = {
            'overall_rating': overall_rating,
            'total_reviews': total_reviews,
            'rating_distribution': rating_distribution,
            'reviews_scraped': len(all_reviews),
            'reviews': all_reviews,
            'timestamp': datetime.now().isoformat(),
            'source_url': url
        }
        
        print(f"\n✅ Successfully extracted {len(all_reviews)} reviews")
        
        # Save to file
        output_file = 'tmobile_reviews.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(structured_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Data saved to '{output_file}'")
        
        return structured_data
        
    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        driver.quit()
        print("\n🔚 Scraper finished")

if __name__ == "__main__":
    # Scrape reviews (adjust max_pages as needed)
    # Note: For ConsumerAffairs T-Mobile reviews, the simple scraper (scrape_reviews_simple.py)
    # works more reliably. Use this Selenium scraper if you need pagination or if the simple
    # scraper stops working.
    scrape_tmobile_reviews(max_pages=5, debug=True)