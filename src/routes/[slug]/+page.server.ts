import Markdoc from '@markdoc/markdoc'
import yaml from 'js-yaml'
import * as fs from 'node:fs/promises'
import path from 'node:path'
import { error } from '@sveltejs/kit';
import { loadMD } from '$lib/api'




export async function load({ params }) {
	const {children, frontmatter} = await loadMD(params.slug)
  const {children: footer} = await loadMD('footer')
	return { 
		children,
    frontmatter,
		footer
	}
}

