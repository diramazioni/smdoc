// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch, locals, url }) => {
  const mainNav = await fetch('/api/nav/menu')
    .then((res) => res.json())
    .catch((err) => {
      console.error('Error fetching main navigation:', err);
      return [];
    });

  // Get base category path for product pages
  let currentPath = url.pathname.slice(1);
  const pathParts = currentPath.split('/');
  
  if (pathParts.length >= 3 ) {
    // If we're on a product page (3 or more segments), get the category path
    currentPath = pathParts.slice(0, 2).join('/');
  }
  // Don't load sidenav for edit pages or single pages
  if (currentPath.startsWith('edit') || !currentPath.includes('/')) {
    currentPath = undefined;
  } 

  let sideNav = [];
  if (currentPath) {
    sideNav = await fetch(`/api/nav/${currentPath}/menu`)
      .then((res) => res.json())
      .catch((err) => {
        console.error('Error fetching side navigation:', err);
        return [];
      });
  }

  return {
    user: locals.user,
    navmenu: mainNav, 
    sidenav: sideNav
  };
};