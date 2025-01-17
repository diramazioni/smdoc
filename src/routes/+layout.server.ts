import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch, locals, url }) => {
  // Fetch main navigation
  const mainNav = await fetch('/api/nav/menu')
  .then((res) => res.json())
  .catch((err) => {
    console.error('Error fetching main navigation:', err);
    return [];
  });
  
  // Try to fetch side navigation if we're in a section
  // Get current path without leading slash
  let currentPath = url.pathname.slice(1);
  if (currentPath.startsWith('edit')) { currentPath = undefined}
  let sideNav = [];
  if (currentPath) {
    // Attempt to fetch menu.md from the current directory
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