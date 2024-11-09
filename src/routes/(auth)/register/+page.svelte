<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card/index.js";

	let { data, form }: { data: PageData, form: ActionData } = $props();
</script>


<form action="?/register" method="POST">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
		  <Card.Title class="text-2xl">Register</Card.Title>
		  <Card.Description>Register your creditials.</Card.Description>
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

      {#if form?.user}
        <p class="error">Username is taken.</p>
      {/if}
    </Card.Content>
    <Card.Footer>
      <Button class="w-full" type="submit">Register</Button>
    </Card.Footer>
  </Card.Root>
</form>
