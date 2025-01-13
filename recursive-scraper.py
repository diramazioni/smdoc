import os
import re
import requests
from bs4 import BeautifulSoup
import html2text
import frontmatter
from urllib.parse import urljoin, urlparse
from datetime import datetime
from collections import deque
import unicodedata

class WebsiteMigrator:
    def __init__(self, base_url, output_dir='mdocs', assets_dir='static/assets'):
        self.base_url = base_url
        self.base_domain = urlparse(base_url).netloc
        self.output_dir = output_dir
        self.assets_dir = assets_dir
        self.h2t = html2text.HTML2Text()
        self.h2t.body_width = 0
        self.visited_urls = set()
        self.url_queue = deque()
        self.setup_directories()

    def setup_directories(self):
        """Create necessary directories if they don't exist."""
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.assets_dir, exist_ok=True)

    def slugify(self, text):
        """Convert text to URL-friendly slug."""
        # Convert to lowercase and normalize unicode characters
        text = text.lower()
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        # Replace anything that's not alphanumeric or hyphen with a space
        text = re.sub(r'[^\w\s-]', ' ', text)
        # Replace one or more spaces or hyphens with a single hyphen
        text = re.sub(r'[-\s]+', '-', text).strip('-')
        return text

    def download_asset(self, url, link_text=''):
        """Download an asset and return its local path."""
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            # Create slug from link text or use a default
            if link_text:
                slug = self.slugify(link_text)
                filename = f"{slug}.pdf"
            else:
                filename = 'document-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '.pdf'
            
            local_path = os.path.join(self.assets_dir, filename)
            
            # Save file
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return os.path.join('/assets', filename)
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            return url

    def is_same_domain(self, url):
        """Check if URL belongs to the same domain."""
        if not url:
            return False
        parsed_url = urlparse(url)
        if not parsed_url.netloc:  # Relative URL
            return True
        return parsed_url.netloc == self.base_domain
    
    def extract_links(self, soup, current_url):
        """Extract all valid links from the page."""
        links = set()
        
        # Process navigation menu
        nav_menu = soup.find('div', class_=lambda x: x and 'navbar' in x)
        if nav_menu:
            navbar_main = nav_menu.find('div', id='navbar-main')
            if navbar_main:
                # Process all navigation links including dropdowns
                for link in navbar_main.find_all('a', href=True):
                    url = link['href']
                    if (not url.startswith('#') and 
                        not url.startswith('javascript:') and
                        not 'data-toggle' in link.attrs and
                        not 'data-target' in link.attrs):
                        absolute_url = urljoin(current_url, url)
                        if self.is_same_domain(absolute_url):
                            links.add(absolute_url)
                            print(f"Added nav link: {absolute_url}")

        # Process other content links
        for link in soup.find_all('a', href=True):
            url = link['href']
            if (not url.startswith('#') and 
                not url.startswith('javascript:') and
                not url.startswith('mailto:') and
                not url.startswith('tel:') and
                not 'data-toggle' in link.attrs and
                not 'data-target' in link.attrs):
                absolute_url = urljoin(current_url, url)
                if self.is_same_domain(absolute_url):
                    links.add(absolute_url)
                    print(f"Added content link: {absolute_url}")

        return links

    def crawl(self, start_url=None, max_pages=None):
        """Crawl the website starting from the given URL."""
        if start_url and start_url not in self.url_queue:
            self.url_queue.append(start_url)
        
        pages_processed = 0
        print(f"\nStarting crawl with queue size: {len(self.url_queue)}")
        
        while self.url_queue and (max_pages is None or pages_processed < max_pages):
            current_url = self.url_queue.popleft()
            
            if current_url not in self.visited_urls:
                print(f"\nProcessing page {pages_processed + 1}: {current_url}")
                
                try:
                    response = requests.get(current_url, timeout=30)
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Extract new links before processing the page
                    new_links = self.extract_links(soup, current_url)
                    for link in new_links:
                        if link not in self.visited_urls and link not in self.url_queue:
                            self.url_queue.append(link)
                            print(f"Added to queue: {link}")
                    
                    # Now process the page
                    self.migrate_page(current_url)
                    pages_processed += 1
                    
                except Exception as e:
                    print(f"Error processing {current_url}: {e}")
                
                print(f"Queue size: {len(self.url_queue)}")
                print("Next 5 URLs in queue:")
                for i, url in enumerate(list(self.url_queue)[:5]):
                    print(f"{i + 1}. {url}")
        
        print(f"\nCrawl completed. Processed {pages_processed} pages.")

def main():
    migrator = WebsiteMigrator(
        base_url='https://digiteco.it',
        output_dir='mdocs',
        assets_dir='static/assets'
    )
    
    # Start crawling from the homepage
    migrator.crawl('https://digiteco.it', max_pages=100)

if __name__ == "__main__":
    main()