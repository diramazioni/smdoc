import Markdoc from '@markdoc/markdoc'
import yaml from 'js-yaml'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import { error } from '@sveltejs/kit';

async function getMD(slug: string) {
  try {
    const file = path.resolve(`mdocs/${slug}.md`)
    return await fs.readFile(file, 'utf-8')
  } catch (e) {
		error(404, {
			message: `Not found ${slug}.md`
		});
  }
}

function getFrontmatter(frontmatter: string) {
	return yaml.load(frontmatter)
}

async function markdoc(slug: string) {
	const md = await getMD(slug)
	const ast = Markdoc.parse(md)
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
	return { 
		children: await markdoc(params.slug),
		footer:		await markdoc('footer')
	}
}

