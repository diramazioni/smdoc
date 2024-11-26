import Markdoc from '@markdoc/markdoc'
import { redirect } from '@sveltejs/kit'
import yaml from 'js-yaml'
import { CloudRainWindIcon } from 'lucide-svelte'
import * as fs from 'node:fs/promises'
import path from 'node:path'

async function getMD(slug: string) {
	const filePath = path.resolve(`mdocs/${slug}.md`);
	const templatePath = path.resolve('mdocs/_templates/new.md');

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
		const file = path.resolve(`mdocs/${slug}.md`)
		await fs.writeFile(file, content, 'utf-8');
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
	const { content: md_only } = getContent(md);
	const ast = Markdoc.parse(md)
	const children = await markdoc(ast)
	const frontmatter = getFrontmatter(ast.attributes.frontmatter)
	return { 
		children,
		md_only,
		frontmatter,
		slug: params.slug
	}
}

export const actions = {
	frontmatter: async ({ params, request }) => {
		try {
			console.log('frontmatter')
			const data = await request.formData();
			// Extract new frontmatter data from the form
			const updatedFrontmatter = {
				title: data.get('title'),
				description: data.get('description'),
				updatedAt: new Date(),
			};
      const slug = data.get('slug')
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
};
