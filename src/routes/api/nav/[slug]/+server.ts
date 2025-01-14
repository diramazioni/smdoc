import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'node:fs/promises';
import { join } from 'path';

interface NavItem {
  href?: string;
  title: string;
  children?: NavItem[];
}

function parseMarkdownToNavItems(markdown: string): NavItem[] {
  const lines = markdown.split('\n').filter(line => line.trim());
  const result: NavItem[] = [];
  let currentLevel = { level: 0, items: result };
  let levels = [currentLevel];

  for (const line of lines) {
    // Count leading spaces to determine nesting level
    const indent = line.search(/\S/);
    const level = indent > 0 ? Math.floor(indent / 2) : 0;
    
    // Extract title and href from markdown link if present
    const linkMatch = line.trim().match(/^\* \[([^\]]+)\]\(([^)]+)\)/);
    const plainTextMatch = line.trim().match(/^\* (.+)/);
    
    let newItem: NavItem;
    
    if (linkMatch) {
      // Line contains a link
      newItem = {
        title: linkMatch[1],
        href: linkMatch[2],
        children: []
      };
    } else if (plainTextMatch) {
      // Line contains plain text (category)
      newItem = {
        title: plainTextMatch[1],
        children: []
      };
    } else {
      continue; // Skip invalid lines
    }

    // Adjust the levels array based on current indent level
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
    const slug = params.slug;
    const navigationPath = join(process.cwd(), 'mdocs', `${slug}.md`);
    const navListData = await readFile(navigationPath, 'utf8');
    const navItems = parseMarkdownToNavItems(navListData);

    return new Response(JSON.stringify(navItems), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error reading navigation file:', err);
    throw error(500, 'Unable to read the Markdown file');
  }
};