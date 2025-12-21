import type { Handle } from "@sveltejs/kit"
import { redirect } from "@sveltejs/kit"
//import { authenticateUser } from "$lib/server/auth"
import { db } from '$lib/server/database'
/*
export const handle: Handle = async ({ event, resolve }) => {
    event.locals.user = await authenticateUser(event)
    if (event.url.pathname.startsWith('/edit') ) {
        console.log('protected')
        if (!event.locals.user) {
            console.log('not authenticated')
            throw redirect(302, '/')
        }
    }

	const response = await resolve(event);
	return response;
}
*/
export const handle: Handle = async ({ event, resolve }) => {
	// get cookies from browser
	const session = event.cookies.get('session')

	if (!session) {
//        if (event.url.pathname.startsWith('/edit') ) {
        redirect(302, '/login')
//        }
		// if there is no session load page as normal and is not loading a reserved page
		return await resolve(event)
	}

	// find the user based on the session
	const user = await db.user.findUnique({
		where: { userAuthToken: session },
		select: { username: true, role: true },
	})

	// if `user` exists set `events.local`
	if (user) {
		event.locals.user = {
			name: user.username,
			role: user.role.name,
		}
	}

	// load page as normal
	return await resolve(event)
}
