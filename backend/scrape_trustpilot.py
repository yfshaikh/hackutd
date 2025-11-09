"""
T-Mobile Trustpilot Reviews Scraper
This script scrapes customer reviews from Trustpilot T-Mobile page.
Uses Selenium for dynamic content loading and supports pagination.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup
import json
from datetime import datetime
import time
import re

def setup_driver():
    """Setup and configure Chrome driver"""
    import tempfile
    
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
    
    # Wait for reviews to load
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "article[data-service-review-card-paper], div[data-service-review-card-paper]"))
        )
        print("✓ Reviews loaded successfully")
    except TimeoutException:
        print("⚠️  Timeout waiting for reviews to load")
    
    # Give page time to fully render
    time.sleep(2)
    
    # Scroll to load all reviews on the page
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1)
    
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    # Find all review cards
    review_cards = soup.find_all(['article', 'div'], attrs={'data-service-review-card-paper': True})
    
    print(f"Found {len(review_cards)} reviews on current page")
    
    if len(review_cards) == 0:
        # Save debug HTML
        debug_file = 'trustpilot_debug_page.html'
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        print(f"⚠️  No reviews found. Page source saved to '{debug_file}' for debugging")
    
    for idx, card in enumerate(review_cards, 1):
        try:
            review = {}
            
            # Extract reviewer name
            name_elem = card.find('span', attrs={'data-consumer-name-typography': True})
            if name_elem:
                review['reviewer_name'] = name_elem.get_text(strip=True)
            else:
                # Try alternative selector
                name_elem = card.find(['h3', 'h4', 'span'], class_=re.compile('consumer|reviewer|author', re.IGNORECASE))
                if name_elem:
                    review['reviewer_name'] = name_elem.get_text(strip=True)
            
            # Extract location (if available)
            location_elem = card.find('div', attrs={'data-consumer-country-typography': True})
            if location_elem:
                review['location'] = location_elem.get_text(strip=True)
            
            # Extract rating (star rating)
            rating_elem = card.find('div', attrs={'data-service-review-rating': True})
            if rating_elem:
                # Try to find the rating from the image alt text or aria-label
                img = rating_elem.find('img')
                if img and img.get('alt'):
                    rating_text = img['alt']
                    match = re.search(r'(\d+)', rating_text)
                    if match:
                        review['rating'] = int(match.group(1))
                else:
                    # Try to extract from class or data attributes
                    rating_div = rating_elem.find('div', class_=re.compile('star', re.IGNORECASE))
                    if rating_div:
                        # Count filled stars
                        stars = rating_elem.find_all(['svg', 'img', 'span'], class_=re.compile('star.*filled|star.*full', re.IGNORECASE))
                        if stars:
                            review['rating'] = len(stars)
            
            # Extract date
            date_elem = card.find('time')
            if date_elem:
                # Try datetime attribute first
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
                # Try alternative selectors
                text_elem = card.find('p', class_=re.compile('review.*text|review.*body', re.IGNORECASE))
            
            if text_elem:
                review_text = text_elem.get_text(strip=True)
                review['review_text'] = review_text
            
            # Extract response from company (if any)
            response_elem = card.find('div', class_=re.compile('reply|response', re.IGNORECASE))
            if response_elem:
                response_text_elem = response_elem.find('p')
                if response_text_elem:
                    review['company_response'] = response_text_elem.get_text(strip=True)
            
            # Only add if we have essential data
            if review.get('review_text'):
                if not review.get('reviewer_name'):
                    review['reviewer_name'] = 'Anonymous'
                reviews.append(review)
                print(f"✓ [{idx}/{len(review_cards)}] Extracted review from {review['reviewer_name']}")
            else:
                print(f"⚠️  [{idx}/{len(review_cards)}] Skipped review - no text found")
            
        except Exception as e:
            print(f"⚠️  [{idx}/{len(review_cards)}] Error parsing review: {e}")
            continue
    
    return reviews

def extract_overall_stats(soup):
    """Extract overall statistics from the page"""
    stats = {}
    
    # Extract TrustScore
    trustscore_elem = soup.find('p', attrs={'data-rating-typography': True})
    if not trustscore_elem:
        trustscore_elem = soup.find(['span', 'p', 'div'], class_=re.compile('TrustScore|rating.*value', re.IGNORECASE))
    
    if trustscore_elem:
        trustscore_text = trustscore_elem.get_text(strip=True)
        match = re.search(r'(\d+\.?\d*)', trustscore_text)
        if match:
            stats['trustscore'] = float(match.group(1))
    
    # Extract total number of reviews
    review_count_elem = soup.find(['span', 'p'], attrs={'data-reviews-count-typography': True})
    if not review_count_elem:
        review_count_elem = soup.find(string=re.compile(r'\d+,?\d*\s+reviews?', re.IGNORECASE))
    
    if review_count_elem:
        count_text = str(review_count_elem) if isinstance(review_count_elem, str) else review_count_elem.get_text(strip=True)
        # Extract number with possible comma separators
        match = re.search(r'([\d,]+)', count_text)
        if match:
            stats['total_reviews'] = int(match.group(1).replace(',', ''))
    
    # Extract rating distribution (stars)
    rating_distribution = {}
    for star in range(1, 6):
        # Look for elements showing star counts
        star_label = f"{star} star" if star == 1 else f"{star} stars"
        # This might need adjustment based on actual Trustpilot structure
        star_elements = soup.find_all(string=re.compile(f'{star}.*star', re.IGNORECASE))
        for elem in star_elements:
            parent = elem.find_parent() if hasattr(elem, 'find_parent') else None
            if parent:
                count_match = re.search(r'(\d+)', parent.get_text())
                if count_match:
                    rating_distribution[f'{star}_star'] = int(count_match.group(1))
                    break
    
    if rating_distribution:
        stats['rating_distribution'] = rating_distribution
    
    return stats

def scrape_trustpilot_reviews(max_pages=5):
    """Main scraping function for Trustpilot"""
    print("🔍 Starting Trustpilot T-Mobile reviews scraper...")
    print(f"Will attempt to scrape up to {max_pages} pages\n")
    
    base_url = "https://www.trustpilot.com/review/www.t-mobile.com"
    
    driver = setup_driver()
    all_reviews = []
    
    try:
        # Load initial page
        driver.get(base_url)
        print(f"📄 Loading page: {base_url}")
        
        # Wait for page to load
        time.sleep(3)
        
        # Scroll to load content
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        
        # Extract overall statistics
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        stats = extract_overall_stats(soup)
        
        print(f"TrustScore: {stats.get('trustscore', 'N/A')}/5")
        print(f"Total Reviews: {stats.get('total_reviews', 'N/A')}")
        if 'rating_distribution' in stats:
            print(f"Rating Distribution: {stats['rating_distribution']}")
        print()
        
        # Scrape reviews from multiple pages
        for page_num in range(1, max_pages + 1):
            print(f"\n📖 Scraping page {page_num}...")
            
            # Extract reviews from current page
            page_reviews = extract_reviews_from_page(driver)
            all_reviews.extend(page_reviews)
            
            print(f"Total reviews collected so far: {len(all_reviews)}")
            
            # Try to navigate to next page
            if page_num < max_pages:
                try:
                    # Look for next page button
                    next_button = None
                    
                    # Try different selectors for pagination
                    selectors = [
                        "a[name='pagination-button-next']",
                        "a[data-pagination-button-next]",
                        "//a[contains(@class, 'pagination') and contains(., 'Next')]",
                        "//button[contains(., 'Next')]",
                        "//a[@aria-label='Next page']",
                    ]
                    
                    for selector in selectors:
                        try:
                            if selector.startswith("//"):
                                next_button = driver.find_element(By.XPATH, selector)
                            else:
                                next_button = driver.find_element(By.CSS_SELECTOR, selector)
                            
                            if next_button and next_button.is_displayed() and next_button.is_enabled():
                                print(f"➡️  Found next button with selector: {selector}")
                                driver.execute_script("arguments[0].scrollIntoView(true);", next_button)
                                time.sleep(1)
                                next_button.click()
                                time.sleep(3)  # Wait for page to load
                                break
                        except (NoSuchElementException, Exception):
                            continue
                    
                    if not next_button:
                        # Try direct URL navigation
                        next_page_url = f"{base_url}?page={page_num + 1}"
                        print(f"➡️  Navigating to: {next_page_url}")
                        driver.get(next_page_url)
                        time.sleep(3)
                        
                except Exception as e:
                    print(f"Error navigating to next page: {e}")
                    break
        
        # Create structured data
        structured_data = {
            **stats,
            'reviews_scraped': len(all_reviews),
            'reviews': all_reviews,
            'timestamp': datetime.now().isoformat(),
            'source_url': base_url,
            'platform': 'trustpilot'
        }
        
        print(f"\n✅ Successfully extracted {len(all_reviews)} reviews")
        
        # Save to file
        output_file = 'tmobile_trustpilot_reviews.json'
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
    # Scrape reviews from Trustpilot (adjust max_pages as needed)
    scrape_trustpilot_reviews(max_pages=5)

