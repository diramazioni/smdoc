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
    
    def normalize_url(self, url):
        """Normalize URL to prevent duplicates from slight variations."""
        parsed = urlparse(url)
        # Remove trailing slash and convert to lowercase
        path = parsed.path.rstrip('/').lower()
        # Reconstruct URL without query parameters or fragments
        return f"{parsed.scheme}://{parsed.netloc}{path}"

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
                        normalized_url = self.normalize_url(absolute_url)
                        if (self.is_same_domain(absolute_url) and 
                            normalized_url not in self.visited_urls and 
                            normalized_url not in [self.normalize_url(u) for u in self.url_queue]):
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
                normalized_url = self.normalize_url(absolute_url)
                if (self.is_same_domain(absolute_url) and 
                    normalized_url not in self.visited_urls and 
                    normalized_url not in [self.normalize_url(u) for u in self.url_queue]):
                    links.add(absolute_url)
                    print(f"Added content link: {absolute_url}")

        return links

    def generate_output_path(self, url, title=''):
        """Generate appropriate output path maintaining directory structure."""
        parsed = urlparse(url)
        path_parts = parsed.path.strip('/').split('/')
        
        # If we have a title, use it for the last part
        if title:
            if path_parts:
                path_parts[-1] = self.slugify(title)
            else:
                path_parts = [self.slugify(title)]
        
        # Ensure all path parts are slugified
        path_parts = [self.slugify(part) for part in path_parts]
        
        # Handle empty path (homepage)
        if not path_parts or path_parts == ['']:
            return os.path.join(self.output_dir, 'index.md')
        
        # Create directory structure
        current_dir = self.output_dir
        for part in path_parts[:-1]:
            current_dir = os.path.join(current_dir, part)
            os.makedirs(current_dir, exist_ok=True)
        
        # Add .md extension to final part
        filename = f"{path_parts[-1]}.md"
        return os.path.join(current_dir, filename)

    def download_asset(self, url, link_text=''):
        """Download an asset and return its local path. Reuse existing files if present."""
        try:
            # First make a HEAD request to get headers without downloading content
            response = requests.head(url)
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
            
            # Determine file extension based on content type
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
            
            # Generate base filename
            if link_text:
                slug = self.slugify(link_text)
                filename = f"{slug}{extension}"
            elif original_filename:
                filename = self.slugify(os.path.splitext(original_filename)[0]) + extension
            else:
                # For URLs without names, use a hash of the URL to ensure consistency
                import hashlib
                url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
                filename = f"asset-{url_hash}{extension}"
            
            # Check if file already exists
            base_path = os.path.join(self.assets_dir, filename)
            if os.path.exists(base_path):
                print(f"Asset already exists: {filename}")
                return os.path.join('/assets', filename)
            
            # If file doesn't exist, download it
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(base_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Downloaded new asset: {filename} (Content-Type: {content_type})")
            return os.path.join('/assets', filename)
            
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            return url
        
    def process_links(self, content, current_url):
        """Process and convert links in content."""
        soup = BeautifulSoup(content, 'html.parser')
        
        # First, process <a> tags that contain images
        for link in soup.find_all('a', href=True):
            url = link['href']
            img = link.find('img')
            link_text = link.get_text(strip=True)
            
            if img and img.get('src'):
                # Handle image inside link
                img_url = img['src']
                img_full_url = urljoin(current_url, img_url)
                
                if any(pattern in img_url for pattern in ['api/documenti', 'api/files']):
                    # Download image using the link text as the filename
                    local_path = self.download_asset(img_full_url, link_text)
                    img['src'] = local_path
            
            # Process the link itself
            full_url = urljoin(current_url, url)
            if any(pattern in url for pattern in ['api/documenti', 'api/files']):
                local_path = self.download_asset(full_url, link_text)
                link['href'] = local_path
            elif self.is_same_domain(full_url):
                markdown_path = self.generate_filename(full_url)
                link['href'] = f"/{markdown_path.replace('.md', '')}"
        
        # Then process standalone images
        for img in soup.find_all('img', src=True):
            # Skip images we've already processed (those inside <a> tags)
            if img.parent.name == 'a':
                continue
                
            url = img['src']
            full_url = urljoin(current_url, url)
            
            if any(pattern in url for pattern in ['api/documenti', 'api/files']):
                # For standalone images, use alt text if available
                img_text = img.get('alt', '') or 'image'
                local_path = self.download_asset(full_url, img_text)
                img['src'] = local_path

        return str(soup)
       
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

    def extract_and_save_menu(self, soup, current_url):
        """Extract navigation menu and save it as menu.md."""
        menu_content = []
        menu_content.append('---\ntitle: Navigation Menu\nupdatedAt: ' + 
                          datetime.now().isoformat() + '\n---\n\n# Navigation Menu\n')
        
        nav_menu = soup.find('div', id='navbar-main')
        if nav_menu:
            menu_items = []  # Store menu items for sorting and organizing
            
            # Process all top-level menu items
            for item in nav_menu.find_all('li', recursive=False):
                # Skip right-aligned items like login
                if item.parent.get('class') and 'navbar-right' in item.parent['class']:
                    continue
                
                # Check if it's a dropdown
                dropdown = item.find('a', class_='dropdown-toggle')
                if dropdown:
                    section = {
                        'title': dropdown.get_text(strip=True).split('\n')[0],  # Remove any extra newlines
                        'items': []
                    }
                    
                    # Get dropdown items
                    dropdown_menu = item.find('ul', class_='dropdown-menu')
                    if dropdown_menu:
                        for subitem in dropdown_menu.find_all('li'):
                            link = subitem.find('a')
                            if link and not link.get('data-toggle'):
                                href = link.get('href', '')
                                text = link.get_text(strip=True)
                                if href and text and not href.startswith('#'):
                                    section['items'].append({
                                        'text': text,
                                        'url': href
                                    })
                    
                    menu_items.append(section)
                else:
                    # Regular menu item
                    link = item.find('a')
                    if link and not link.get('data-toggle'):
                        href = link.get('href', '')
                        text = link.get_text(strip=True)
                        if href and text and not href.startswith('#'):
                            menu_items.append({
                                'text': text,
                                'url': href
                            })

            # Generate markdown content
            for item in menu_items:
                if isinstance(item, dict) and 'title' in item:
                    # Dropdown section
                    menu_content.append(f"\n## {item['title']}\n")
                    for subitem in item['items']:
                        if self.is_same_domain(subitem['url']):
                            menu_content.append(f"- [{subitem['text']}]({subitem['url']})")
                        else:
                            menu_content.append(f"- [{subitem['text']}]({subitem['url']})")
                else:
                    # Regular item
                    if self.is_same_domain(item['url']):
                        menu_content.append(f"- [{item['text']}]({item['url']})")
                    else:
                        menu_content.append(f"- [{item['text']}]({item['url']})")
        
        # Save menu
        menu_path = os.path.join(self.output_dir, 'menu.md')
        with open(menu_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(menu_content))
        print(f"Successfully saved menu to: {menu_path}")

    def clean_content(self, soup):
        """Remove navigation and other unwanted elements from content."""
        # Remove the navbar
        navbar = soup.find('div', class_=lambda x: x and 'navbar' in x)
        if navbar:
            navbar.decompose()
        
        # Remove login modal
        login_modal = soup.find('div', id='login-modal')
        if login_modal:
            login_modal.decompose()
        
        # Remove cookie notice
        cookie_modal = soup.find('div', id='cookie-modal')
        if cookie_modal:
            cookie_modal.decompose()
        
        # Remove scripts
        for script in soup.find_all('script'):
            script.decompose()
            
        # Remove meta tags and other head content
        head = soup.find('head')
        if head:
            head.decompose()
        
        return soup

    def migrate_page(self, url):
        """Migrate a single page from URL to markdown file."""
        try:
            print(f"\nMigrating {url}")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract menu from the first page only
            if url == self.base_url or not os.path.exists(os.path.join(self.output_dir, 'menu.md')):
                self.extract_and_save_menu(soup, url)
            
            # Clean the content before processing
            cleaned_soup = self.clean_content(soup)
            
            # Extract title and description
            title = soup.title.string if soup.title else ''
            if '|' in title:
                title = title.split('|')[1].strip()
            
            description = soup.find('meta', {'name': 'description'})
            description = description['content'] if description else ''
            
            # Get main content
            main_content = cleaned_soup.find('main') or cleaned_soup.find('article') or cleaned_soup.body
            
            if main_content is None:
                print(f"Warning: Could not find main content in {url}")
                main_content = cleaned_soup
            
            # Generate output path using URL structure and title
            output_path = self.generate_output_path(url, title)
            
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
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save markdown file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
                
            print(f"Successfully saved markdown to: {output_path}")
            return True
            
        except Exception as e:
            print(f"Error migrating {url}: {e}")
            return False
               
    def crawl(self, start_url=None, max_pages=None):
        """Crawl the website starting from the given URL."""
        if start_url:
            normalized_start = self.normalize_url(start_url)
            if normalized_start not in [self.normalize_url(u) for u in self.url_queue]:
                self.url_queue.append(start_url)
        
        pages_processed = 0
        error_pages = []
        successful_pages = []
        print(f"\nStarting crawl with queue size: {len(self.url_queue)}")
        
        while self.url_queue and (max_pages is None or pages_processed < max_pages):
            current_url = self.url_queue.popleft()
            normalized_current = self.normalize_url(current_url)
            
            if normalized_current not in self.visited_urls:
                print(f"\nProcessing page {pages_processed + 1}: {current_url}")
                
                try:
                    # Mark as visited before processing
                    self.visited_urls.add(normalized_current)
                    
                    # First try to get the page content
                    response = requests.get(current_url, timeout=30)
                    if response.status_code >= 400:
                        print(f"Error {response.status_code} while processing {current_url}")
                        error_pages.append((current_url, f"HTTP {response.status_code}"))
                        continue
                    
                    # Parse the page and extract links
                    soup = BeautifulSoup(response.text, 'html.parser')
                    new_links = self.extract_links(soup, current_url)
                    
                    # Add new links to queue
                    for link in new_links:
                        normalized_link = self.normalize_url(link)
                        if (normalized_link not in self.visited_urls and 
                            normalized_link not in [self.normalize_url(u) for u in self.url_queue]):
                            self.url_queue.append(link)
                            print(f"Added to queue: {link}")
                    
                    # Now try to migrate the page
                    if self.migrate_page(current_url):
                        pages_processed += 1
                        successful_pages.append(current_url)
                    else:
                        error_pages.append((current_url, "Migration failed"))
                    
                except requests.exceptions.RequestException as e:
                    print(f"Network error while processing {current_url}: {str(e)}")
                    error_pages.append((current_url, f"Network error: {str(e)}"))
                    continue
                    
                except Exception as e:
                    print(f"Unexpected error processing {current_url}: {str(e)}")
                    error_pages.append((current_url, f"Unexpected error: {str(e)}"))
                    continue
                
                # Print progress
                print(f"\nCrawling Progress:")
                print(f"- Queue size: {len(self.url_queue)}")
                print(f"- Visited pages: {len(self.visited_urls)}")
                print(f"- Successfully processed: {len(successful_pages)}")
                print(f"- Failed pages: {len(error_pages)}")
                if self.url_queue:
                    print("\nNext URLs in queue:")
                    for i, url in enumerate(list(self.url_queue)[:5]):
                        print(f"{i + 1}. {url}")
        
        # Print final summary
        print(f"\nCrawl completed:")
        print(f"- Successfully processed: {len(successful_pages)} pages")
        print(f"- Total visited URLs: {len(self.visited_urls)}")
        print(f"- Failed pages: {len(error_pages)}")
        
        if error_pages:
            print("\nPages with errors:")
            for url, error in error_pages:
                print(f"- {url}: {error}")

        return successful_pages, error_pages
  
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