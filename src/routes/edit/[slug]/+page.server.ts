import yaml from 'js-yaml'
import fs from 'fs/promises'
import path from 'node:path'
import { error } from '@sveltejs/kit';
import { 
	getMD,
	loadMD,
	copyTemplate,
	setMD, 
	getFileList, 
	getContent, 
	docDir,
	assetsDir 
  } from '$lib/api'

export async function load({ params }) {
		const {children, frontmatter, md_only} = await loadMD(params.slug)
		const docFiles = await getFileList(docDir)
		const assetFiles = await getFileList(assetsDir)
		const listAssets = {
			'md':docFiles.filter((file) => file.endsWith('.md')),
			'pdf':assetFiles.filter((file) => file.endsWith('.pdf')),
			'img':assetFiles.filter((file) =>  file.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) !== null),
		}
		return { 
			children,
			md_only,
			frontmatter,
			slug: params.slug,
			listAssets
		}
}

export const actions = {
	frontmatter: async ({ url, request }) => {
		try {
			const data = await request.formData();
			// Extract new frontmatter data from the form
			const updatedFrontmatter = {
				title: data.get('title'),
				description: data.get('description'),
				slug:  data.get('slug'),
				updatedAt: new Date(),
			};
      		const slug = data.get('slug')
			// console.log("updatedFrontmatter", updatedFrontmatter)
			let md = await getMD(slug)
			if (!md) {
				md = await copyTemplate(slug)
			}
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
			console.log('save lenght', updatedMd.length)
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
