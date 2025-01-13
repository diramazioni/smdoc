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
        self.h2t.body_width = 0  # Don't wrap lines
        self.visited_urls = set()
        self.url_queue = deque()
        self.setup_directories()

    def setup_directories(self):
        """Create necessary directories if they don't exist."""
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.assets_dir, exist_ok=True)

    def slugify(self, text):
        """Convert text to URL-friendly slug."""
        text = text.lower()
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        text = re.sub(r'[^\w\s-]', ' ', text)
        text = re.sub(r'[-\s]+', '-', text).strip('-')
        return text

    def download_asset(self, url, link_text=''):
        """Download an asset and return its local path."""
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            # Get content type from response headers
            content_type = response.headers.get('content-type', '').lower()
            
            # Try to get original filename from content-disposition header
            content_disp = response.headers.get('content-disposition')
            original_filename = None
            if content_disp:
                import re
                fname = re.findall("filename=(.+)", content_disp)
                if fname:
                    original_filename = fname[0].strip('"')
            
            # Determine file extension based on content type or original filename
            extension = None
            if original_filename:
                extension = os.path.splitext(original_filename)[1]
            if not extension:
                # Map common content types to extensions
                content_type_map = {
                    'application/pdf': '.pdf',
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/gif': '.gif',
                    'image/svg+xml': '.svg',
                    'application/msword': '.doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                    'application/vnd.ms-excel': '.xls',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                    'application/zip': '.zip',
                    'text/plain': '.txt',
                    'text/csv': '.csv'
                }
                extension = content_type_map.get(content_type, '.bin')
            
            # Generate filename
            if link_text:
                # Use link text if available
                slug = self.slugify(link_text)
                filename = f"{slug}{extension}"
            elif original_filename:
                # Use original filename if available
                filename = self.slugify(os.path.splitext(original_filename)[0]) + extension
            else:
                # Generate generic filename with timestamp
                filename = 'asset-' + datetime.now().strftime('%Y%m%d-%H%M%S') + extension
            
            # Ensure filename is unique
            base_path = os.path.join(self.assets_dir, filename)
            counter = 1
            while os.path.exists(base_path):
                base_name = os.path.splitext(filename)[0]
                filename = f"{base_name}-{counter}{extension}"
                base_path = os.path.join(self.assets_dir, filename)
                counter += 1
            
            # Save file
            with open(base_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Downloaded asset: {filename} (Content-Type: {content_type})")
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

    def generate_filename(self, url):
        """Generate an appropriate markdown filename from URL."""
        path = urlparse(url).path.strip('/')
        if not path:
            path = 'index'
        elif path.endswith('/'):
            path = path[:-1]
        
        filename = re.sub(r'\.[^.]+$', '', path.replace('/', '-'))
        filename = self.slugify(filename)
        return f"{filename}.md"

    def process_links(self, content, current_url):
        """Process and convert links in content."""
        soup = BeautifulSoup(content, 'html.parser')
        
        for tag in soup.find_all(['a', 'img']):
            url = tag.get('href') or tag.get('src')
            if not url:
                continue

            full_url = urljoin(current_url, url)
            
            if any(pattern in url for pattern in ['api/documenti', 'api/files']):
                link_text = tag.string if tag.name == 'a' else ''
                local_path = self.download_asset(full_url, link_text)
                if tag.name == 'a':
                    tag['href'] = local_path
                else:
                    tag['src'] = local_path
            elif self.is_same_domain(full_url):
                markdown_path = self.generate_filename(full_url)
                if tag.name == 'a':
                    tag['href'] = f"/{markdown_path.replace('.md', '')}"

        return str(soup)

    def convert_to_markdown(self, html_content, title='', description='', current_url=''):
        """Convert HTML to Markdown with frontmatter."""
        processed_html = self.process_links(html_content, current_url)
        markdown_content = self.h2t.handle(processed_html)
        
        post = frontmatter.Post(
            markdown_content,
            title=title,
            description=description,
            url=current_url,
            updatedAt=datetime.now().isoformat()
        )
        
        return frontmatter.dumps(post)

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

    def migrate_page(self, url):
        """Migrate a single page from URL to markdown file."""
        try:
            if url in self.visited_urls:
                return
            
            print(f"Migrating {url}")
            self.visited_urls.add(url)
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract title and description
            title = soup.title.string if soup.title else ''
            if '|' in title:
                title = title.split('|')[1].strip()
            
            description = soup.find('meta', {'name': 'description'})
            description = description['content'] if description else ''
            
            # Get main content
            main_content = soup.find('main') or soup.find('article') or soup.body
            
            if main_content is None:
                print(f"Warning: Could not find main content in {url}")
                main_content = soup
            
            # Generate output filename
            output_filename = self.generate_filename(url)
            
            # Convert to markdown
            try:
                markdown_content = self.convert_to_markdown(
                    str(main_content),
                    title=title,
                    description=description,
                    current_url=url
                )
            except Exception as e:
                print(f"Error converting to markdown: {e}")
                markdown_content = f"""---
title: {title}
description: {description}
url: {url}
updatedAt: {datetime.now().isoformat()}
---

# {title}"""
            
            # Save markdown file
            output_path = os.path.join(self.output_dir, output_filename)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
                
            print(f"Successfully migrated {url} to {output_path}")
            
        except Exception as e:
            print(f"Error migrating {url}: {e}")

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
        assets_dir='assets'
    )
    
    # Start crawling from the homepage
    migrator.crawl('https://digiteco.it', max_pages=100)

if __name__ == "__main__":
    main()