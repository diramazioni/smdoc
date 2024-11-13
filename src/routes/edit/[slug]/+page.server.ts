import Markdoc from '@markdoc/markdoc'
import yaml from 'js-yaml'
import { CloudRainWindIcon } from 'lucide-svelte'
import * as fs from 'node:fs/promises'
import path from 'node:path'

async function getMD(slug: string) {
	const file = path.resolve(`posts/${slug}.md`)
	return await fs.readFile(file, 'utf-8')
}

function getFrontmatter(frontmatter: string) {
	return yaml.load(frontmatter)
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
	console.log('FM')
	console.log(frontmatter)
	const raw = Markdoc.renderers.html(children);
	return { 
		children,
		md_only,
		frontmatter,
		slug: params.slug,
		raw
	}
}
