import os
import re
import requests
from bs4 import BeautifulSoup
import html2text
import frontmatter
from urllib.parse import urljoin, urlparse
from datetime import datetime

class WebsiteMigrator:
    def __init__(self, base_url, output_dir='mdocs', assets_dir='static/assets'):
        self.base_url = base_url
        self.output_dir = output_dir
        self.assets_dir = assets_dir
        self.h2t = html2text.HTML2Text()
        self.h2t.body_width = 0  # Don't wrap lines
        self.setup_directories()

    def setup_directories(self):
        """Create necessary directories if they don't exist."""
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.assets_dir, exist_ok=True)

    def download_asset(self, url):
        """Download an asset and return its local path."""
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            # Extract filename from URL or Content-Disposition
            filename = os.path.basename(urlparse(url).path)
            if not filename:
                filename = url.split('/')[-1]
            
            # Clean filename
            filename = re.sub(r'[^\w\-_\.]', '-', filename)
            local_path = os.path.join(self.assets_dir, filename)
            
            # Save file
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return os.path.join('/assets', filename)
        except Exception as e:
            print(f"Error downloading {url}: {e}")
            return url

    def process_links(self, content):
        """Process and download assets for all links in content."""
        soup = BeautifulSoup(content, 'html.parser')
        
        # Process all links and downloads
        for tag in soup.find_all(['a', 'img']):
            url = tag.get('href') or tag.get('src')
            if url and (url.startswith('http') or url.startswith('//')):
                full_url = urljoin(self.base_url, url)
                if 'api/documenti' in url: #any(ext in url.lower() for ext in ['.pdf', '.jpg', '.png', '']):
                    local_path = self.download_asset(full_url)
                    if tag.name == 'a':
                        tag['href'] = local_path
                    else:
                        tag['src'] = local_path

        return str(soup)

    def convert_to_markdown(self, html_content, title='', description=''):
        """Convert HTML to Markdown with frontmatter."""
        # Process links and assets first
        processed_html = self.process_links(html_content)
        
        # Convert to markdown
        markdown_content = self.h2t.handle(processed_html)
        
        # Create frontmatter
        post = frontmatter.Post(
            markdown_content,
            title=title,
            description=description,
            updatedAt=datetime.now().isoformat()
        )
        
        return frontmatter.dumps(post)

    def migrate_page(self, url, output_filename):
        """Migrate a single page from URL to markdown file."""
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract title and description
            title = soup.title.string if soup.title else ''
            # Clean up title by removing site name if present
            if '|' in title:
                title = title.split('|')[1].strip()
            
            description = soup.find('meta', {'name': 'description'})
            description = description['content'] if description else 'Sezione dedicata alla trasparenza amministrativa'
            
            # Get main content (adjust selector based on your HTML structure)
            main_content = soup.find('main') or soup.find('article') or soup.body
            
            if main_content is None:
                print(f"Warning: Could not find main content in {url}")
                main_content = soup
            
            # Convert to markdown
            try:
                markdown_content = self.convert_to_markdown(
                    str(main_content),
                    title=title,
                    description=description
                )
            except Exception as e:
                print(f"Error converting to markdown: {e}")
                # Fallback to basic frontmatter
                markdown_content = f"""---
title: {title}
description: {description}
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

def main():
  
    # Migrate specific pages
    migrator = WebsiteMigrator(base_url='https://www.savlmarradi.it', output_dir='mdocs', assets_dir='static/assets')
    migrator.migrate_page(
        'https://www.savlmarradi.it/societa-trasparente',
        'societa-trasparente.md'
    )

if __name__ == "__main__":
    main()
