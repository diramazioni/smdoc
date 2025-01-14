
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

