import Markdoc from '@markdoc/markdoc'
import { redirect } from '@sveltejs/kit'
import yaml from 'js-yaml'
import { CloudRainWindIcon } from 'lucide-svelte'
import * as fs from 'node:fs/promises'
import path from 'node:path'

async function getMD(slug: string) {
	const file = path.resolve(`posts/${slug}.md`)
	return await fs.readFile(file, 'utf-8')
}
async function setMD(slug: string, content: string) {
	const file = path.resolve(`posts/${slug}.md`)
	await fs.writeFile(file, content, 'utf-8');
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
		const data = await request.formData();

		// Extract new frontmatter data from the form
		const updatedFrontmatter = {
			title: data.get('title'),
			description: data.get('description'),
			updatedAt: new Date(),
		};
		const md = await getMD(params.slug)
		const { content } = getContent(md);
		const newYaml = yaml.dump(updatedFrontmatter);
		const updatedMd = `---\n${newYaml}\n---\n${content}`;
		await setMD(params.slug, updatedMd)
		redirect(303, `/${params.slug}`)

	},
	save: async ({ params, request }) => {
		const data = await request.formData();
		const updatedContent = data.get('updatedContent')
		const md = await getMD(params.slug)
		const { frontmatter } = getContent(md);
		const updatedMd = `---\n${frontmatter}\n---\n${updatedContent}`;
		await setMD(params.slug, updatedMd)
		//redirect(303, `/${params.slug}`)
	},
};
