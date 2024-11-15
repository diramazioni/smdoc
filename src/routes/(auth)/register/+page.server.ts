import { fail, redirect } from '@sveltejs/kit'
import bcrypt from "bcrypt"
import { db } from '$lib/server/database.ts'
import type { Actions } from './$types';

// using an enum for user roles to avoid typos
// if you're not using TypeScript use an object
enum Roles {
	ADMIN = 'ADMIN',
	USER = 'USER',
}

export const load = async ({ locals }) => {
	// redirect user if logged in
	if (locals.user.role !== 'ADMIN') {
		redirect(302, '/');
	}
}

export const actions: Actions = {
	register: async ({ request, url }) => {
		const data = await request.formData()
		const username = data.get('username')
		const password = data.get('password')

		if (
			typeof username !== 'string' ||
			typeof password !== 'string' ||
			!username ||
			!password
		) {
			return fail(400, { invalid: true })
		}

		const user = await db.user.findUnique({
			where: { username },
		})

		if (user) {
			return fail(400, { user: true })
		}

		await db.user.create({
			data: {
				username,
				passwordHash: await bcrypt.hash(password, 10),
				userAuthToken: crypto.randomUUID(),
				role: { connect: { name: Roles.USER } },
			},
		})

		redirect(303, '/');
	},
} satisfies Actions;
