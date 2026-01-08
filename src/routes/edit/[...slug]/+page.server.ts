import { error, redirect } from '@sveltejs/kit';
import path from 'node:path';
import fs from 'node:fs/promises';
import { 
  getMD,
  loadMD,
  copyTemplate,
  setMD, 
  getFileList, 
  getContent,
  DOCS_DIR,
  ASSETS_DIR
} from '$lib/api'
import yaml from 'js-yaml';

export async function load({ params, depends }) {
  const { children, frontmatter, md_only } = await loadMD(params.slug);
  depends('page')
  console.log("load slug", params.slug)
  const [mdFiles, pdfFiles, imgFiles] = await Promise.all([
    getFileList('md'),
    getFileList('pdf'),
    getFileList('img')
  ]);

  const listAssets = {
    'md': mdFiles,
    'pdf': pdfFiles,
    'img': imgFiles
  };

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
			console.debug('save frontmatter')
			const data = await request.formData();
			// Extract new frontmatter data from the form
			const updatedFrontmatter = {
				title: data.get('title') as string,
				description: data.get('description') as string,
				slug:  data.get('slug') as string,
				updatedAt: new Date(),
			};
      		const slug = data.get('slug') as string
			// console.log("updatedFrontmatter", updatedFrontmatter)
			let md = await getMD(slug)
			if (!md) {
				md = await copyTemplate(slug)
			}
			const { content } = getContent(md);
			const newYaml = yaml.dump(updatedFrontmatter);
			console.debug("newYaml", newYaml)
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
			console.debug('save md')
			const data = await request.formData();
			const updatedContent = data.get('updatedContent') as string
			const slug = data.get('slug') as string
			console.log('s1')
			const md = await getMD(slug)
			if (!md) {
				return { success: false, error: 'File not found' };
			}
			console.log('s2')
			const { frontmatter } = getContent(md);
			// console.debug("updatedContent", updatedContent)
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
				filePath = path.join(DOCS_DIR, file.name);
				} else {
				filePath = path.join(ASSETS_DIR, file.name);
				}
				await fs.writeFile(filePath, buffer as any);
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
    const slug:string = data.get('slug') as string
    let filePath = ''
    if(slug.endsWith('.md')) {
      filePath = path.join(DOCS_DIR, slug);
    } else {
      filePath = path.join(ASSETS_DIR, slug);
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
	},

	createDirectory: async ({ request }) => {
		try {
			const data = await request.formData();
			const directoryName = data.get('directoryName') as string;
			const parentPath = data.get('parentPath') as string | null;

			if (!directoryName || directoryName.trim() === '') {
				return {
					success: false,
					error: 'Directory name is required'
				};
			}

			const { createDirectory } = await import('$lib/api');
			const fullPath = await createDirectory(directoryName.trim(), parentPath || undefined);

			return {
				success: true,
				path: fullPath
			};
		} catch (error) {
			console.error('Error creating directory:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to create directory'
			};
		}
	}

};
