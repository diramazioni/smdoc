import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'node:fs/promises';
import { join } from 'path';

interface NavItem {
  href?: string;
  title: string;
  img?: string;
  children?: NavItem[];
}

function parseMarkdownToNavItems(markdown: string): NavItem[] {
  const lines = markdown.split('\n').filter(line => line.trim());
  const result: NavItem[] = [];
  let currentLevel = { level: 0, items: result };
  let levels = [currentLevel];

  for (const line of lines) {
    const indent = line.search(/\S/);
    const level = indent > 0 ? Math.floor(indent / 2) : 0;
    
    // Match line with image and link: * ![title](/img/path) [title](/link)
    const imageAndLinkMatch = line.trim().match(/^\* !\[([^\]]+)\]\(([^)]+)\)\s*\[([^\]]+)\]\(([^)]+)\)/);
    // Match normal link: * [title](/link)
    const linkMatch = line.trim().match(/^\* \[([^\]]+)\]\(([^)]+)\)/);
    // Match plain text: * Text
    const plainTextMatch = line.trim().match(/^\* (.+)/);
    
    let newItem: NavItem;
    
    if (imageAndLinkMatch) {
      // If we have both image and link
      newItem = {
        title: imageAndLinkMatch[3],
        href: imageAndLinkMatch[4],
        img: imageAndLinkMatch[2],
        children: []
      };
    } else if (linkMatch) {
      // If we only have a link
      newItem = {
        title: linkMatch[1],
        href: linkMatch[2],
        children: []
      };
    } else if (plainTextMatch) {
      // If we just have text
      newItem = {
        title: plainTextMatch[1],
        children: []
      };
    } else {
      continue;
    }

    while (level < levels.length - 1) {
      levels.pop();
    }
    while (level > levels.length - 1) {
      const newLevel = {
        level: levels.length,
        items: levels[levels.length - 1].items[levels[levels.length - 1].items.length - 1].children!
      };
      levels.push(newLevel);
    }

    levels[levels.length - 1].items.push(newItem);
  }

  return result;
}

export const GET: RequestHandler = async ({ params }) => {
    try {
        const slugParts = params.slug.split('/');
        const filePath = join(process.cwd(), 'mdocs', ...slugParts) + '.md';

        const navListData = await readFile(filePath, 'utf8');
        const navItems = parseMarkdownToNavItems(navListData);
        
        return new Response(JSON.stringify(navItems), {
          headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error in nav API:', err);
        // Return empty array instead of crashing
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
    }
};