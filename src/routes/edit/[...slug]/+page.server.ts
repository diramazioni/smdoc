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
	create: async ({ request }) => {
		try {
			console.debug('Unified create action');
			const data = await request.formData();
			
			// Optional: Save current document
			const saveCurrent = data.get('saveCurrent') === 'true';
			if (saveCurrent) {
				const currentSlug = data.get('currentSlug') as string;
				const currentTitle = data.get('currentTitle') as string;
				const currentDescription = data.get('currentDescription') as string;
				const currentContent = data.get('currentContent') as string;

				if (currentSlug) {
					console.log('Saving current doc before creation:', currentSlug);
					const md = await getMD(currentSlug);
					if (md) {
						const updatedFrontmatter = {
							title: currentTitle,
							description: currentDescription,
							slug: currentSlug,
							updatedAt: new Date(),
						};
						const newYaml = yaml.dump(updatedFrontmatter);
						const finalMd = `---\n${newYaml}\n---\n${currentContent}`;
						await setMD(currentSlug, finalMd);
					}
				}
			}

			// Create new document
			const newTitle = data.get('newTitle') as string;
			const newSlug = data.get('newSlug') as string;
			const newDescription = (data.get('newDescription') as string) || '';

			console.log('Creating new document:', newSlug);
			const initialContent = '# ' + newTitle + '\n\nNuovo documento.';
			const yamlFrontmatter = {
				title: newTitle,
				description: newDescription,
				slug: newSlug,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			const newMd = `---\n${yaml.dump(yamlFrontmatter)}\n---\n${initialContent}`;
			await setMD(newSlug, newMd);

			return { success: true, newSlug };
		} catch (error) {
			console.error('Create action error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'An unknown error occurred'
			};
		}
	},
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
			console.debug('Unified save action');
			const data = await request.formData();
			const slug = data.get('slug') as string;
			const updatedContent = data.get('updatedContent') as string;
			const title = data.get('title') as string;
			const description = data.get('description') as string;

			const md = await getMD(slug);
			if (!md) {
				return { success: false, error: 'File not found' };
			}

			// If title or description are provided, we update frontmatter
			let finalMd = '';
			if (title !== null || description !== null) {
				const { content } = getContent(md);
				const updatedFrontmatter = {
					title: title ?? (data.get('title') as string),
					description: description ?? (data.get('description') as string),
					slug: slug,
					updatedAt: new Date(),
				};
				const newYaml = yaml.dump(updatedFrontmatter);
				finalMd = `---\n${newYaml}\n---\n${updatedContent ?? content}`;
			} else {
				const { frontmatter } = getContent(md);
				finalMd = `---\n${frontmatter}\n---\n${updatedContent}`;
			}

			console.log('Saving document:', slug, 'Length:', finalMd.length);
			await setMD(slug, finalMd);
			return { success: true };
		} catch (error) {
			console.error('Save action error:', error);
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

	rename: async ({ request }) => {
		try {
			const data = await request.formData();
			const oldSlug = data.get('oldSlug') as string;
			const newSlug = data.get('newSlug') as string;
			const title = data.get('title') as string;
			const description = data.get('description') as string;
			const content = data.get('content') as string;

			if (!oldSlug || !newSlug) {
				return { success: false, error: 'Slugs are required' };
			}

			const { renameMD, setMD } = await import('$lib/api');
			await renameMD(oldSlug, newSlug);

			// Update frontmatter in the renamed file
			const updatedFrontmatter = {
				title,
				description,
				slug: newSlug,
				updatedAt: new Date(),
			};
			const yaml = await import('js-yaml');
			const newYaml = yaml.dump(updatedFrontmatter);
			const updatedMd = `---\n${newYaml}\n---\n${content}`;
			
			await setMD(newSlug, updatedMd);

			return { success: true, newSlug };
		} catch (error) {
			console.error('Error renaming file:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to rename file'
			};
		}
	},

	createDirectory: async ({ request }) => {

		try {
			const data = await request.formData();
			const directoryName = data.get('directoryName') as string;
			const parentPath = data.get('parentPath') as string | null;
			const baseType = (data.get('baseType') as 'md' | 'asset' | null) || 'md';

			if (!directoryName || directoryName.trim() === '') {
				return {
					success: false,
					error: 'Directory name is required'
				};
			}

			if (baseType !== 'md' && baseType !== 'asset') {
				return {
					success: false,
					error: 'Invalid directory type'
				};
			}

			const { createDirectory } = await import('$lib/api');
			const fullPath = await createDirectory(
        directoryName.trim(), 
        parentPath || undefined,
        baseType
      );

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
