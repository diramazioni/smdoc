import { error, redirect } from '@sveltejs/kit';
import { 
  getMD,
  loadMD,
  copyTemplate,
  setMD, 
  getFileList, 
  getContent
} from '$lib/api'
import yaml from 'js-yaml';
import path from 'path';
import fs from 'fs/promises';
import { DOCS_DIR } from '$lib/config/files.server';

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
	frontmatter: async ({ request }) => {
		try {
		  const data = await request.formData();
		  const title = data.get('title') as string;
		  const description = data.get('description') as string;
		  const slug = data.get('slug') as string;
		  const directory = data.get('directory') as string;
	
		  const updatedFrontmatter = {
			title,
			description,
			slug,
			updatedAt: new Date(),
		  };
	
		  // Ensure directory exists
		  if (directory) {
			const dirPath = path.join(DOCS_DIR, directory);
			await fs.mkdir(dirPath, { recursive: true });
		  }
	
		  let md = await getMD(slug);
		  if (!md) {
			md = await copyTemplate(slug);
		  }
	
		  const { content } = getContent(md);
		  const newYaml = yaml.dump(updatedFrontmatter);
		  const updatedMd = `---\n${newYaml}\n---\n${content}`;
		  
		  await setMD(slug, updatedMd);
		  
		  return { type: 'success' };
		} catch (error) {
		  console.error('Error saving frontmatter:', error);
		  return { 
			type: 'error',
			message: error instanceof Error ? error.message : 'An unknown error occurred'
		  };
		}
	  },
	
	save: async ({ request }) => {
		try {
		  const data = await request.formData();
		  const updatedContent = data.get('updatedContent') as string;
		  const slug = data.get('slug') as string;
		  const directory = data.get('directory') as string;
	
		  // Ensure directory exists
		  if (directory) {
			const dirPath = path.join(DOCS_DIR, directory);
			await fs.mkdir(dirPath, { recursive: true });
		  }
	
		  const md = await getMD(slug);
		  const { frontmatter } = getContent(md);
		  const updatedMd = `---\n${frontmatter}\n---\n${updatedContent}`;
		  
		  await setMD(slug, updatedMd);
		  return { type: 'success' };
		} catch (error) {
		  console.error('Error saving content:', error);
		  return {
			type: 'error',
			message: error instanceof Error ? error.message : 'An unknown error occurred'
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
