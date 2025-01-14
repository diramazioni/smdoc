import type { LayoutServerLoad } from './$types'

// get `locals.user` and pass it to the `page` store
export const load: LayoutServerLoad = async ({ fetch, locals }) => {
  return {
    user: locals.user,
    items: await fetch('/api/nav/menu')
      .then((res) => res.json())
      .catch((err) => {
        console.error('Error fetching navigation:', err);
        return [];
      })
  }
}