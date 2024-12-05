import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			bodySizeLimit: 1048576 // 1MB
		  })
	},
}

export default config
