import { redirect } from '@sveltejs/kit';

export const GET = ({ request, url, cookies }) => {
    console.log('logout')
    cookies.delete("session", { path: '/' })
    const redirectTo = url.searchParams.get('redirectTo')?.replace('/edit', '')
    redirect(303, redirectTo ?? '/')
};