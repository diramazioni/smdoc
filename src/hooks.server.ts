import type { Handle } from "@sveltejs/kit"
import { redirect } from "@sveltejs/kit"
import { authenticateUser } from "$lib/server/auth"
export const handle: Handle = async ({ event, resolve }) => {
    event.locals.user = await authenticateUser(event)
    if (event.url.pathname.startsWith('/edit') ) {
        console.log('protected')
        if (!event.locals.user) {
            console.log('not authenticated')
            throw redirect(302, '/')
        }
    }

	return resolve(event)
}
