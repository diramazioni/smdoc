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
    const filePath = path.resolve(`${DOCS_DIR}/${slug}.md`);
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    return undefined;
  }
}

export async function copyTemplate(slug: string) {
  const filePath = path.resolve(`${DOCS_DIR}/${slug}.md`);
  const templatePath = path.resolve(`${DOCS_DIR}/_templates/new.md`);
  console.log('File not found, copying from template');
  await fs.copyFile(templatePath, filePath);
  return await fs.readFile(filePath, 'utf-8');
}

export async function setMD(slug: string, content: string) {
  try {
    const file = path.resolve(`${DOCS_DIR}/${slug}.md`);
    console.debug('Writing to file:', file);
    await fs.writeFile(file, content, 'utf-8');
  } catch (error: any) {
    throw error(500, error);
  }
}

export async function getFileList(type: FileType): Promise<string[]> {
  try {
    const directory = getDirectoryForType(type);
    const files = await fs.readdir(directory);
    
    return files.filter(file => {
      const mimeType = getMimeTypeFromFilename(file);
      if (!mimeType) return false;
      
      switch(type) {
        case 'md':
          return file.endsWith('.md');
        case 'pdf':
          return file.endsWith('.pdf');
        case 'img':
          return mimeType.startsWith('image/');
        default:
          return false;
      }
    });
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
      spacer: {
        render: 'Spacer',
        attributes: {
          h: {
            type: String,
            default: '1',
          },
        }
      },
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