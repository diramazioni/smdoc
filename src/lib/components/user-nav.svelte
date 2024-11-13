<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
  import { KeyRound, LogOut, CircleUserRound, UserRoundCheck, User } from 'lucide-svelte';
  import { page } from '$app/stores';

    // let { user } = $props()
    let user = $page.data.user;
    
    const loginUrL = "/login?/login&redirectTo=/edit" + $page.url.pathname;
    const logoutUrL = "/logout?/logout&redirectTo=/edit" + $page.url.pathname;

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
      <CircleUserRound class="h-8 w-8 rounded-full"  />
    {:else if user.role === 'USER'}
      <UserRoundCheck class="h-8 w-8 rounded-full" />  
    {/if}
    <Button variant="ghost"  class="absolute hover:bg-green-500 hover:bg-opacity-25 -mx-4 -my-8  h-8 w-8 rounded-full">
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

		<DropdownMenu.Group>

    </DropdownMenu.Group>
		<DropdownMenu.Separator />
    {#if user.role === 'ADMIN'}
      <DropdownMenu.Item>
        <KeyRound class="mr-2 h-4 w-4" />
        <a href='/register' >Register</a>
        <DropdownMenu.Shortcut>⇧⌘R</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    {/if}
      <DropdownMenu.Item>
        <LogOut class="mr-2 h-4 w-4" />
        <a href={logoutUrL} >Log out</a>
        <DropdownMenu.Shortcut>⇧⌘O</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</form>
{/if}
