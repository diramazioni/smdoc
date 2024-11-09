<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
  import { CircleUserRound, UserRoundCheck, User } from 'lucide-svelte';
  import { page } from '$app/stores';

    // let { user } = $props()
    let user = $page.data.user;
    console.log(user)
    const loginUrL = "/login?/login&redirectTo=/edit" + $page.url.pathname;
    const logoutUrL = "/login?/logout&redirectTo=/edit" + $page.url.pathname;

    // const response = await fetch(logoutUrL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(formData)
    // });
</script>

{#if !user}
<div class="bg-destructive rounded-sm">

  <a href={loginUrL} >
    <User size={32} color="#c52020"/>
  </a>
</div>
{/if}

{#if user}
<form action="/login?/logout&redirectTo={$page.url.pathname}" method="POST">
<DropdownMenu.Root>
	<DropdownMenu.Trigger >
    <!-- <div class="bg-accent-foreground rounded-sm"> -->
    

    <!-- </div> -->
    {#if user.role === 'ADMIN'}
    <CircleUserRound size={32} />
    {:else if user.role === 'USER'}
      <UserRoundCheck size={32} />  
    {/if}
    <Button variant="ghost"  class="absolute  h-8 w-8 rounded-full">
    </Button>

      <!-- 
			<Avatar.Root class="h-8 w-8">
				<Avatar.Image src="/avatars/01.png" alt="User" />
				<Avatar.Fallback>User Account</Avatar.Fallback>
			</Avatar.Root>
		</Button> -->
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56" align="end">
    <DropdownMenu.Label class="font-normal">
      <div class="flex flex-col space-y-1">
        <p class="text-sm font-medium leading-none">{user.name}</p>
        <p class="text-muted-foreground text-xs leading-none">{user.role}</p>
      </div>
    </DropdownMenu.Label>

		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.Item>
				Profile
				<DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				Billing
				<DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				Settings
				<DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item>New Team</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
      <DropdownMenu.Item>
        <Button type="submit">Log out</Button>
        <DropdownMenu.Shortcut>⇧⌘Q</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</form>
{/if}
