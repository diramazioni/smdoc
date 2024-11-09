<script lang="ts">
  import "../app.css";
  import '@fontsource-variable/manrope';
  import { page } from '$app/stores';
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator/index.js";
  
  import { Pencil } from 'lucide-svelte';

  import SidebarNav from "$lib/components/sidebar-nav.svelte";
  import UserNav from "$lib/components/user-nav.svelte";
  
  let { children } = $props()

  
  const sidebarNavItems = [
    {
			title: "Home",
			href: "/",
		},
		{
			title: "Appearance",
			href: "/examples/forms/appearance",
		},
		{
			title: "Notifications",
			href: "/examples/forms/notifications",
		},
		{
			title: "Display",
			href: "/examples/forms/display",
		},
	];
  const loginUrL = "/login?/login&redirectTo=/edit" + $page.url.pathname;
</script>

<svelte:head>
  <title>Markdoc</title>
</svelte:head>

<main>
  <div class="flex justify-between items-center ">
    <SidebarNav items={sidebarNavItems} />  
    <div class="m-3">
      <UserNav/>
    </div>

  </div>
  
  <nav class="m-4 hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">

    {#if !$page.data.user}
    <form action={loginUrL} method="POST">
      <Button type="submit">Login</Button>
    </form>  
    {/if}
  
    {#if $page.data.user}
      {#if !$page.url.pathname.startsWith('/edit')}
        <a href="/edit{$page.url.pathname}" class="menu">
        <Pencil />
        </a>
        <Separator orientation="vertical" />
      {:else}
        <form action="/save?/save&redirectTo={$page.url.pathname}" method="POST">
          <Button type="submit">Save</Button>
        </form>      
        <Separator orientation="vertical" />
      {/if}
  
      <form action="/login?/logout&redirectTo={$page.url.pathname}" method="POST">
        <Button type="submit">Log out</Button>
      </form>
    {/if}
  </nav>
  
  <div class="space-y-1 m-4">
    <h4 class="text-sm font-medium leading-none">Markdoc title</h4>
    <p class="text-muted-foreground text-sm">
      This is a subtile description of the Markdoc title.
    </p>
  </div>
  <Separator class="my-4" /> 
  <div class="m-4">

    {@render children()}
  </div>
</main>

<style>
  .menu {
    @apply text-foreground hover:text-accent-foreground transition-colors;
  }
  
  /* :global(body) {
    height: 100svh;
    display: grid;
    place-items: center;
    margin: 0px;
    font-family: 'Manrope Variable';
    line-height: 1.8;
    color: white;
    background-color: oklch(20% 0.01 200);
  }

  :global(a) {
    color: inherit;
  }

  main {
    max-width: 60ch;
    margin-inline: auto;
  } */

</style>