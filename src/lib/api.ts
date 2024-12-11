
import Markdoc from '@markdoc/markdoc'

import yaml from 'js-yaml'
import fs from 'fs/promises'
import path from 'node:path'
import { error } from '@sveltejs/kit'

export const docDir = "mdocs"
export const assetsDir = "static/assets"

export async function getMD(slug: string) {
  try {
    const filePath = path.resolve(`${docDir}/${slug}.md`)
    return await fs.readFile(filePath, 'utf-8')
  } catch (error: any) {
    return undefined
  }
}

export async function copyTemplate(slug: string) {
  const filePath = path.resolve(`${docDir}/${slug}.md`)
  const templatePath = path.resolve(`${docDir}/_templates/new.md`)

  console.log('File not found, copying from template')
  await fs.copyFile(templatePath, filePath)
  return await fs.readFile(filePath, 'utf-8')
}

export async function setMD(slug: string, content: string) {
  try {
    const file = path.resolve(`${docDir}/${slug}.md`)
    await fs.writeFile(file, content, 'utf-8')
  } catch (error: any) {
    error(500, error)
  }
}

export async function getFileList(dir: string) {
  const dirPath = path.resolve(dir)
  try {
    const files = await fs.readdir(dirPath)
    return files
  } catch (error: any) {
    error(500, error)
  }
}

export function getFrontmatter(frontmatter: string) {
  return yaml.load(frontmatter)
}

export function getContent(md: string): { frontmatter: string, content: string } {
  const frontmatterStart = md.indexOf('---') + 3 // Start of frontmatter content
  const frontmatterEnd = md.indexOf('---', frontmatterStart) // End of frontmatter
  const frontmatter = md.slice(frontmatterStart, frontmatterEnd).trim() // Extract frontmatter content
  
  const content = md.slice(frontmatterEnd + 3).trim() // Extract content after frontmatter
  
  return { frontmatter, content }
}

export async function markdoc(ast: Node) {
  const content = Markdoc.transform(ast, {
    tags: {
      callout: {
        render: 'Callout',
        attributes: {
          type: {
            type: String,
            default: 'note',
          },
        },
      },
      counter: {
        render: 'Counter',
      },
    },
    variables: {
      frontmatter: getFrontmatter(ast.attributes.frontmatter),
    },
  })
  // console.log(JSON.stringify(content))
  return JSON.stringify(content.children)
}



export async function loadMD(slug:string) {
	const md = await getMD(slug)
  if (!md) {
    return error(404, 'Not found')
  }
	const { content: md_only } = getContent(md);
	const ast = Markdoc.parse(md)
	const children = await markdoc(ast)
	const frontmatter = getFrontmatter(ast.attributes.frontmatter)
    return {
        children,
        frontmatter,
        md_only
    }
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
      // Create guestbook.md if it doesn't exist
      await setMD('guestbook', `---\ntitle: Guestbook\ndescription: Our visitors' messages\n---\n`);
      return [];
    }
    
    const { content } = getContent(md);
    
    // Parse messages from markdown content
    // Remove any leading/trailing whitespace and split by '---'
    return content.trim()
      .split('---')
      .filter(entry => entry.trim()) // Remove empty entries
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
    const { frontmatter = '', content = '' } = md ? getContent(md) : { 
      frontmatter: 'title: Guestbook\ndescription: Our visitors\' messages', 
      content: '' 
    };

    const date = new Date().toISOString();
    const newEntry = `---\n**${entry.name}** | ${entry.email} | ${date}\n${entry.content}`;
    
    // If there's existing content, add it after the new entry
    const updatedContent = content.trim() ? `${newEntry}\n${content.trim()}` : newEntry;
    const updatedMd = `---\n${frontmatter}\n---\n${updatedContent}`;
    
    await setMD('guestbook', updatedMd);
    return true;
  } catch (error) {
    console.error('Error adding guestbook entry:', error);
    return false;
  }
}