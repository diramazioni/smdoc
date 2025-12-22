<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { cn } from "$lib/utils.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    KeyRound,
    LogOut,
    CircleUserRound,
    UserRoundCheck,
    User,
  } from "lucide-svelte";
  import { page } from "$app/stores";

  interface Props {
    class?: string;
  }
  let { class: className = "" }: Props = $props();

  let user = $page.data.user;

  let loginUrL = $derived(
    "/login?/login&redirectTo=/edit" + $page.url.pathname,
  );
  let logoutUrL = $derived(
    "/logout?/logout&redirectTo=/edit" + $page.url.pathname,
  );
</script>

<div class={cn("hidden md:flex items-center", className)}>
  {#if !user}
    <div class="hover:bg-white/10 p-1 rounded-full transition-colors">
      <a href={loginUrL} class="text-inherit">
        <User size={28} />
      </a>
    </div>
  {/if}

  {#if user}
    <form action="/login?/logout&redirectTo={$page.url.pathname}" method="POST">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <!-- <div class="bg-accent-foreground rounded-sm"> -->

          <!-- </div> -->
          {#if user.role === "ADMIN"}
            <CircleUserRound
              class="h-8 w-8 rounded-full transition-transform hover:scale-110"
            />
          {:else if user.role === "USER"}
            <UserRoundCheck
              class="h-8 w-8 rounded-full transition-transform hover:scale-110"
            />
          {/if}

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
              <p class="text-muted-foreground text-xs leading-none">
                {user.role}
              </p>
            </div>
          </DropdownMenu.Label>

          <DropdownMenu.Group></DropdownMenu.Group>
          <DropdownMenu.Separator />
          {#if user.role === "ADMIN"}
            <DropdownMenu.Item>
              <KeyRound class="mr-2 h-4 w-4" />
              <a href="/register">Register</a>
              <DropdownMenu.Shortcut>⇧⌘R</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
          {/if}
          <DropdownMenu.Item>
            <LogOut class="mr-2 h-4 w-4" />
            <a href={logoutUrL}>Log out</a>
            <!-- rel="external" -->
            <DropdownMenu.Shortcut>⇧⌘O</DropdownMenu.Shortcut>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </form>
  {/if}
</div>
