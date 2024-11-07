import Markdoc from '@markdoc/markdoc'
import yaml from 'js-yaml'
import * as fs from 'node:fs/promises'
import path from 'node:path'

import { redirect } from "@sveltejs/kit"
import type { Actions } from './$types';


async function getPost(slug: string) {
	const file = path.resolve(`posts/${slug}.md`)
	return await fs.readFile(file, 'utf-8')
}

function getFrontmatter(frontmatter: string) {
	return yaml.load(frontmatter)
}

async function markdoc(slug: string) {
	const post = await getPost(slug)
	const ast = Markdoc.parse(post)
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
	return { children: await markdoc(params.slug) }
}

export const actions: Actions = {
	login: async ({ cookies }) => {
		cookies.set("auth", "adminToken", {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
			maxAge: 60 * 60 * 24 * 7, // 1 week
		})
		console.log('login')
		throw redirect(303, "/")
	},
	logout:  async ({ cookies }) => {
		cookies.delete("auth", { path: '/' })
		console.log('logout')
		
		throw redirect(303, "/")
	},

} satisfies Actions;
