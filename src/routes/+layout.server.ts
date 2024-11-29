import type { LayoutServerLoad } from './$types'

// get `locals.user` and pass it to the `page` store
export const load: LayoutServerLoad = async ({ fetch, locals }) => {
  return {
    user: locals.user,
    items: await fetch('/api/menu')
    .then((res) => res.json())
    .then((data) => data)
    .catch((err) => console.log(err))
  }
}