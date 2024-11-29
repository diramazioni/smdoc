import Markdoc from '@markdoc/markdoc'
import { redirect } from '@sveltejs/kit'
import yaml from 'js-yaml'
import { CloudRainWindIcon } from 'lucide-svelte'
// import * as fs from 'node:fs/promises'
import fs from 'fs/promises'
import path from 'node:path'

const docDir = "mdocs"
const assetsDir = "static/assets"

async function getMD(slug: string) {
	const filePath = path.resolve(`${docDir}/${slug}.md`);
	const templatePath = path.resolve(`${docDir}/_templates/new.md`);

	try {
		return await fs.readFile(filePath, 'utf-8');
	} catch (error: any) {
		if (error.code === 'ENOENT') {
      console.log('File not found, copying from template');
			// File not found, copy from template
			await fs.copyFile(templatePath, filePath);
			return await fs.readFile(filePath, 'utf-8');
		} else {
			throw error;
		}
	}
}
async function setMD(slug: string, content: string) {
	try {
		const file = path.resolve(`${docDir}/${slug}.md`)
		await fs.writeFile(file, content, 'utf-8');
	} catch (error: any) {
		throw error;
	}
}

async function getFileList(dir: string) {
	const dirPath = path.resolve(dir);
	try {
		const files = await fs.readdir(dirPath);
		return files;
	} catch (error: any) {
		throw error;
	}
}

function getFrontmatter(frontmatter: string) {
	return yaml.load(frontmatter)
}

function getContent(mdContent: string): { frontmatter: string, content: string } {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = mdContent.match(frontmatterRegex);
	const frontmatter = match ? match[1] : ''; // if no frontmatter, use an empty string
	const content = match ? match[2] : mdContent; // if no frontmatter, use the whole content
	return { frontmatter, content };
}

async function markdoc(ast: Node) {
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
	// @ts-ignore
	return JSON.stringify(content.children)
}

export async function load({ params }) {
	const md = await getMD(params.slug)
	const docFiles = await getFileList(docDir)
	const assetFiles = await getFileList(assetsDir)
	const { content: md_only } = getContent(md);
	const ast = Markdoc.parse(md)
	const children = await markdoc(ast)
	const frontmatter = getFrontmatter(ast.attributes.frontmatter)
	return { 
		children,
		md_only,
		frontmatter,
		slug: params.slug,
		list_md: docFiles.filter((file) => file.endsWith('.md')),
		list_img: assetFiles.filter((file) => file.endsWith('.png') || file.endsWith('.jpg')),
		list_pdf: assetFiles.filter((file) => file.endsWith('.pdf')),
	}
}

export const actions = {
	frontmatter: async ({ url, request }) => {
		try {
			console.log('frontmatter')
			const data = await request.formData();
			// Extract new frontmatter data from the form
			const updatedFrontmatter = {
				title: data.get('title'),
				description: data.get('description'),
				slug:  data.get('slug'),
				updatedAt: new Date(),
			};
      		const slug = data.get('slug')
			console.log("slug", slug)
			// const md = await getMD(params.slug)
			const md = await getMD(slug)
			const { content } = getContent(md);
			const newYaml = yaml.dump(updatedFrontmatter);
			const updatedMd = `---\n${newYaml}\n---\n${content}`;
			await setMD(slug, updatedMd)
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'An unknown error occurred'
			};
		}
	},
	save: async ({ params, request }) => {
		try {
			console.log('save')
			const data = await request.formData();
			const updatedContent = data.get('updatedContent')
			const slug = data.get('slug')
			const md = await getMD(slug)
			const { frontmatter } = getContent(md);
			const updatedMd = `---\n${frontmatter}\n---\n${updatedContent}`;
			await setMD(slug, updatedMd)
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'An unknown error occurred'
			};
		}
	},
	upload: async ({ request }) => {
		const data = await request.formData();
		const files = data.getAll('file') as File[];
		try {
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let filePath = ''
        if(file.name.endsWith('.md')) {
          filePath = path.join(docDir, file.name);
        } else {
          filePath = path.join(assetsDir, file.name);
        }
        await fs.writeFile(filePath, buffer);
      }
			// const arrayBuffer = await file.arrayBuffer();
      
			// const buffer = Buffer.from(arrayBuffer);
			// const filePath = path.join(assetsDir, file.name);
			// await fs.writeFile(filePath, buffer);

			return {
			  success: true,
			};
		} catch (error) {
			console.error('Error saving file:', error);
			return {
			  status: 500,
			  errors: { message: 'Failed to save file' },
			};
		}
	},

	delete: async ({ request }) => {
    const data = await request.formData();
    const slug:string = data.get('slug')
    let filePath = ''
    if(slug.endsWith('.md')) {
      filePath = path.join(docDir, slug);
    } else {
      filePath = path.join(assetsDir, slug);
    }
    try {
      await fs.unlink(filePath);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        status: 500,
        errors: { message: 'Failed to delete file' },
      };
    }
	}

};
