import type { PageServerLoad } from './$types'

// get `locals.user` and pass it to the `page` store
export const load: PageServerLoad = async ({ fetch }) => {
  return {
    links: await fetch('/api/links/home')
    .then((res) => res.json())
    .then((data) => data)
    .catch((err) => console.log(err))
  }
}