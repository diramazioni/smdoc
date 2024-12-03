
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

export function getContent(mdContent: string): { frontmatter: string, content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = mdContent.match(frontmatterRegex)
  const frontmatter = match ? match[1] : ''
  const content = match ? match[2] : mdContent
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