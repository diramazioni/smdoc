import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'path';
export const GET: RequestHandler = async ({ url }) => {
	try {
		// Path for Markdown file containg the navigation list
		const navigationPath = join(process.cwd(), 'mdocs', 'menu.md');
		const navListData = await readFile(navigationPath, 'utf8');
        
        // Parse the Markdown file to extract links and return as a JSON response
        const linksArray = navListData.split('\n')
            .map(line => {
                const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                return match ? { href: match[2].replace('.md',''), title: match[1] } : null;
            })
            .filter(item => item !== null);

        return new Response(JSON.stringify(linksArray), {
            headers: { 'Content-Type': 'application/json' }
        });

	} catch (err) {
		console.error('Error reading navigation file:', err);
		throw error(500, 'Unable to read the Markdown file');
	}
};