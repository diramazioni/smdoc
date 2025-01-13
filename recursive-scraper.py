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
        for tag in soup.find_all('a', href=True):
            url = tag['href']
            absolute_url = urljoin(current_url, url)
            
            # Skip anchors, javascript, mailto links
            if (url.startswith('#') or 
                url.startswith('javascript:') or 
                url.startswith('mailto:') or 
                url.startswith('tel:')):
                continue
                
            if self.is_same_domain(absolute_url):
                links.add(absolute_url)
        return links

    def generate_filename(self, url):
        """Generate an appropriate markdown filename from URL."""
        path = urlparse(url).path.strip('/')
        if not path:
            path = 'index'
        elif path.endswith('/'):
            path = path[:-1]
            
        # Replace slashes with dashes and remove file extension
        filename = re.sub(r'\.[^.]+$', '', path.replace('/', '-'))
        # Create slug
        filename = self.slugify(filename)
        return f"{filename}.md"

    def process_links(self, content, current_url):
        """Process and download assets for all links in content."""
        soup = BeautifulSoup(content, 'html.parser')
        
        # Extract new links to crawl
        new_links = self.extract_links(soup, current_url)
        for link in new_links:
            if link not in self.visited_urls:
                self.url_queue.append(link)
        
        # Process all links and downloads
        for tag in soup.find_all(['a', 'img']):
            url = tag.get('href') or tag.get('src')
            if url and (url.startswith('http') or url.startswith('//')):
                full_url = urljoin(self.base_url, url)
                if 'api/documenti' in url:
                    link_text = tag.string if tag.name == 'a' else ''
                    local_path = self.download_asset(full_url, link_text)
                    if tag.name == 'a':
                        tag['href'] = local_path
                    else:
                        tag['src'] = local_path

        return str(soup)

    def convert_to_markdown(self, html_content, title='', description='', current_url=''):
        """Convert HTML to Markdown with frontmatter."""
        # Process links and assets first
        processed_html = self.process_links(html_content, current_url)
        
        # Convert to markdown
        markdown_content = self.h2t.handle(processed_html)
        
        # Create frontmatter
        post = frontmatter.Post(
            markdown_content,
            title=title,
            description=description,
            url=current_url,
            updatedAt=datetime.now().isoformat()
        )
        
        return frontmatter.dumps(post)

    def migrate_page(self, url):
        """Migrate a single page from URL to markdown file."""
        try:
            if url in self.visited_urls:
                return
            
            print(f"Migrating {url}")
            self.visited_urls.add(url)
            
            response = requests.get(url, timeout=30)  # Added timeout
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
            
        except requests.exceptions.RequestException as e:
            print(f"Network error while migrating {url}: {e}")
        except Exception as e:
            print(f"Error migrating {url}: {e}")

    def crawl(self, start_url, max_pages=None):
        """Crawl the website starting from the given URL."""
        self.url_queue.append(start_url)
        pages_processed = 0
        
        while self.url_queue and (max_pages is None or pages_processed < max_pages):
            current_url = self.url_queue.popleft()
            if current_url not in self.visited_urls:
                self.migrate_page(current_url)
                pages_processed += 1
                print(f"Processed {pages_processed} pages")

def main():
    migrator = WebsiteMigrator(
        base_url='https://digiteco.it',
        output_dir='mdocs',
        assets_dir='static/assets'
    )
    
    # Start crawling from the homepage, limit to 100 pages
    migrator.crawl('https://digiteco.it', max_pages=100)

if __name__ == "__main__":
    main()