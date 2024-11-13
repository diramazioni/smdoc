import Markdoc from '@markdoc/markdoc'
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
function splitFrontmatter(md: string) {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
	const match = md.match(frontmatterRegex);
	if (match) {
		return  md.slice(match[0].length)
	}

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
	const md_only = splitFrontmatter(md)
	const ast = Markdoc.parse(md)
	const children = await markdoc(ast)
	const frontmatter = getFrontmatter(ast.attributes.frontmatter)
	const raw = Markdoc.renderers.html(children);

	return { 
		children,
		md_only,
		frontmatter,
		slug: params.slug,
		raw
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
		const { content: currentContent } = getContent(md);
		const newYaml = yaml.dump(updatedFrontmatter);
		const updatedMd = `---\n${newYaml}---\n${currentContent}`;
		await setMD(params.slug, updatedMd)
	},
	content: async ({ params, request }) => {
		const data = await request.formData();
		const updatedContent = data.get('content');
		const md = await getMD(params.slug)
		const { frontmatter: currentFrontmatter } = getContent(md);
		const updatedMd = `---\n${currentFrontmatter}---\n${updatedContent}`;
		await setMD(params.slug, updatedMd)
	},
};
