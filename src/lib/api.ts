import Markdoc from '@markdoc/markdoc';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'node:path';
import { error } from '@sveltejs/kit';
import { 
  type FileType,
  getMimeTypeFromFilename,
  isAllowedFileType 
} from '$lib/config/files.types';
import { 
  DOCS_DIR, 
  ASSETS_DIR,
  getFileDirectory,
  getDirectoryForType 
} from '$lib/config/files.server';

// Ensure directories exist on startup
Promise.all([
  fs.mkdir(DOCS_DIR, { recursive: true }),
  fs.mkdir(ASSETS_DIR, { recursive: true })
]);

export async function getMD(slug: string) {
  try {
    // Ensure the slug is properly sanitized and normalized
    console.log('gslug', slug)
    const normalizedSlug = path.normalize(slug).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.resolve(DOCS_DIR, `${normalizedSlug}.md`);

    const realPath = await fs.realpath(filePath);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

export async function copyTemplate(slug: string) {
  const normalizedSlug = path.normalize(slug).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.resolve(DOCS_DIR, `${normalizedSlug}.md`);
  const templatePath = path.resolve(DOCS_DIR, '_templates/new.md');

  // Create directory structure if it doesn't exist
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  console.log('File not found, copying from template');
  await fs.copyFile(templatePath, filePath);
  return await fs.readFile(filePath, 'utf-8');
}

export async function setMD(slug: string, content: string) {
  try {
    const normalizedSlug = path.normalize(slug).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.resolve(DOCS_DIR, `${normalizedSlug}.md`);

    // Create directory structure if it doesn't exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Verify the resolved path is still within DOCS_DIR
    const realPath = await fs.realpath(path.dirname(filePath));
    if (!realPath.startsWith(await fs.realpath(DOCS_DIR))) {
      throw new Error('Invalid path');
    }

    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error: any) {
    console.error('Error writing file:', error);
    throw error;
  }
}

export async function getFileList(type: FileType): Promise<string[]> {
  try {
    const directory = getDirectoryForType(type);
    const files: string[] = [];

    // Recursive function to get all files in directory and subdirectories
    async function getFiles(dir: string, baseDir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (entry.isDirectory()) {
          await getFiles(fullPath, baseDir);
        } else {
          const mimeType = getMimeTypeFromFilename(entry.name);
          if (!mimeType) continue;

          switch(type) {
            case 'md':
              if (entry.name.endsWith('.md')) files.push(relativePath);
              break;
            case 'pdf':
              if (entry.name.endsWith('.pdf')) files.push(relativePath);
              break;
            case 'img':
              if (mimeType.startsWith('image/')) files.push(relativePath);
              break;
          }
        }
      }
    }

    await getFiles(directory, directory);
    return files;

  } catch (error: any) {
    console.error('Error reading directory:', error);
    return [];
  }
}

export async function deleteFile(filename: string): Promise<boolean> {
  try {
    const mimeType = getMimeTypeFromFilename(filename);
    if (!mimeType) {
      throw new Error('Invalid file type');
    }

    const directory = getFileDirectory(mimeType);
    const filePath = path.resolve(path.join(directory, filename));

    // Verify the file is within the allowed directories
    const realPath = await fs.realpath(filePath);
    const isInDocsDir = realPath.startsWith(path.resolve(DOCS_DIR));
    const isInAssetsDir = realPath.startsWith(path.resolve(ASSETS_DIR));

    if (!isInDocsDir && !isInAssetsDir) {
      throw new Error('Invalid file path');
    }

    await fs.unlink(filePath);
    return true;
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return false;
  }
}

export function getFrontmatter(frontmatter: string) {
  return yaml.load(frontmatter);
}

export function getContent(md: string): { frontmatter: string; content: string } {
  const frontmatterStart = md.indexOf('---') + 3;
  const frontmatterEnd = md.indexOf('---', frontmatterStart);
  const frontmatter = md.slice(frontmatterStart, frontmatterEnd).trim();
  const content = md.slice(frontmatterEnd + 3).trim();
  return { frontmatter, content };
}

export async function markdoc(ast: any) {
  const content = Markdoc.transform(ast, {
    tags: {
      callout: {
        render: 'Callout',
        attributes: {
          color: {
            type: String,
            default: 'default',
          },
        },
      },
      drop: {
        render: 'Drop',
        attributes: {
          title: {
            type: String,
            default: '',
          },          
          color: {
            type: String,
            default: 'default',
          },
          open: {
            type: Boolean,
            default: false,
          }
        },
      },
      cols: {
        render: 'Columns',
        attributes: {
          gap: {
            type: String,
            default: '4'
          },
          align: {
            type: String,
            default: 'left',
            matches: ['left', 'center', 'right']
          },
          cl: {
            type: String,
            default: ''
          }
        }
      },
      col: {
        render: 'Column',
        attributes: {
          w: {
            type: String,
            default: '100'
          },
          align: {
            type: String,
            default: 'left',
            matches: ['left', 'center', 'right']
          }
        }
      },
      spacer: {
        render: 'Spacer',
        attributes: {
          h: {
            type: String,
            default: '1',
          },
        }
      },
      image: {
        render: 'ImageWrapper',
        attributes: {
          width: { type: String },
          height: { type: String },
          align: { 
            type: String,
            default: 'left',
            matches: ['left', 'center', 'right']
          }
        }
      },
      gallery: {
        render: 'ImageGallery',
        attributes: {
          delay: { 
            type: Number,
            default: 5000
          },
          height: {
            type: String,
            default: '400px'
          }
        }
      }      
    },
    variables: {
      frontmatter: getFrontmatter(ast.attributes.frontmatter),
    },
  });
  return JSON.stringify(content.children);
}

export async function loadMD(slug: string) {
  const md = await getMD(slug);
  if (!md) {
    throw error(404, 'Not found');
  }
  const { content: md_only } = getContent(md);
  const ast = Markdoc.parse(md);
  const children = await markdoc(ast);
  const frontmatter = getFrontmatter(ast.attributes.frontmatter);
  return {
    children,
    frontmatter,
    md_only
  };
}

export interface GuestbookEntry {
  name: string;
  email: string;
  content: string;
  date: string;
}

export async function getGuestbookEntries(): Promise<GuestbookEntry[]> {
  try {
    const md = await getMD('guestbook');
    if (!md) {
      await setMD('guestbook', `---\ntitle: Guestbook\ndescription: Our visitors' messages\n---\n`);
      return [];
    }
    const { content } = getContent(md);
    return content.trim()
      .split('---')
      .filter(entry => entry.trim())
      .map(entry => {
        const [info, ...contentLines] = entry.trim().split('\n');
        const [name, email, date] = info.split(' | ');
        return {
          name: name?.replace('**', '').replace('**', '') || '',
          email: email || '',
          date: date || '',
          content: contentLines.join('\n').trim()
        };
      })
      .filter(entry => entry.name && entry.content);
  } catch (error) {
    console.error('Error reading guestbook:', error);
    return [];
  }
}

export async function addGuestbookEntry(entry: Omit<GuestbookEntry, 'date'>): Promise<boolean> {
  try {
    const md = await getMD('guestbook');
    const { frontmatter = '', content = '' } = md 
      ? getContent(md) 
      : { 
        frontmatter: 'title: Guestbook\ndescription: Our visitors\' messages', 
        content: '' 
      };

    const date = new Date().toISOString();
    const newEntry = `---\n**${entry.name}** | ${entry.email} | ${date}\n${entry.content}`;
    const updatedContent = content.trim() ? `${newEntry}\n${content.trim()}` : newEntry;
    const updatedMd = `---\n${frontmatter}\n---\n${updatedContent}`;
    
    await setMD('guestbook', updatedMd);
    return true;
  } catch (error) {
    console.error('Error adding guestbook entry:', error);
    return false;
  }
}