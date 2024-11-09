<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';

	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card/index.js";

	let { data, form }: { data: PageData, form: ActionData } = $props();
	console.log($page.params);
</script>

<form action="/login?/login&redirectTo={$page.url.searchParams.get('redirectTo') ?? '/'}" method="POST">
<Card.Root class="w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Login</Card.Title>
    <Card.Description>Enter your creditials.</Card.Description>
  </Card.Header>
  <Card.Content class="grid gap-4">
      <div>
        <Label for="username">Username</Label>
        <Input type="text" name="username" placeholder="username" required/>
      </div>
    
      <div>
        <Label for="password">Password</Label>
        <Input type="password" name="password" placeholder="password" required/>		
      </div>
      {#if form?.invalid}
        <p class="error">Username and password is required.</p>
      {/if}
    
      {#if form?.credentials}
        <p class="error">You have entered the wrong credentials.</p>
      {/if}
    
  </Card.Content>
  <Card.Footer>
    <Button class="w-full" type="submit">Log in</Button>
  </Card.Footer>
</Card.Root>	
</form>    

