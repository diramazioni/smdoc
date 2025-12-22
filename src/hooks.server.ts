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
	// Redirect .md URLs to clean URLs
	if (event.url.pathname.endsWith('.md')) {
		const cleanPath = event.url.pathname.slice(0, -3);
		redirect(301, cleanPath);
	}

	// get cookies from browser
	const session = event.cookies.get('session')
	
	// Define public routes that don't require authentication
	const publicRoutes = ['/login', '/logout', '/register', '/api'];
	const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route));

	if (!session) {
		// If trying to access protected content (anything non-public), redirect to login
		if (!isPublicRoute) {
			redirect(302, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`)
		}
		// For public routes, continue normally
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
