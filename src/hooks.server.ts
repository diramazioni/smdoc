import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { authenticateUser } from "$lib/server/auth";
import { db } from '$lib/server/database';
import { getAuthMode, type AuthMode } from '$lib/config';

export const handle: Handle = async ({ event, resolve }) => {
	const authMode = getAuthMode();
	event.locals.user = await authenticateUser(event);

	// Apply protection based on AUTH_MODE
	if (authMode === 'edit-only') {
		// Current behavior: protect only /edit routes
		if (event.url.pathname.startsWith('/edit')) {
			console.log('protected (edit-only mode)')
			if (!event.locals.user) {
				console.log('not authenticated')
				throw redirect(302, '/')
			}
		}
	} else if (authMode === 'all-protected') {
		// New behavior: protect all routes except publicRoutes
		const publicRoutes = ['/login', '/logout', '/register', '/api'];
		const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route));

		if (!isPublicRoute && !event.locals.user) {
			console.log('protected (all-protected mode)')
			throw redirect(302, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`)
		}
	}

	const response = await resolve(event);
	return response;
}

export const handle: Handle = async ({ event, resolve }) => {
	// Redirect .md URLs to clean URLs
	if (event.url.pathname.endsWith('.md')) {
		const cleanPath = event.url.pathname.slice(0, -3);
		redirect(301, cleanPath);
	}
	
	// get cookies from browser
	const session = event.cookies.get('session')

	// find user based on session
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
