<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData, form: ActionData } = $props();
	console.log($page.params);
</script>

<h1>Login</h1>

<form action="/login?/login&redirectTo={$page.url.searchParams.get('redirectTo') ?? '/'}" method="POST">

	<div>
		<label for="username">Username</label>
		<input id="username" name="username" type="text" required />
	</div>

	<div>
		<label for="password">Password</label>
		<input id="password" name="password" type="password" required />
	</div>

	{#if form?.invalid}
		<p class="error">Username and password is required.</p>
	{/if}

	{#if form?.credentials}
		<p class="error">You have entered the wrong credentials.</p>
	{/if}

	<button type="submit">Log in</button>
</form>
