<script lang="ts">
  import "../app.css";
  import '@fontsource-variable/manrope';
  import { page } from '$app/stores';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Pencil} from 'lucide-svelte';

  import SidebarNav from "$lib/components/sidebar-nav.svelte";
  import UserNav from "$lib/components/user-nav.svelte";
  import { Toaster } from "$lib/components/ui/sonner/index.js";

  let { children, data } = $props()

  
  const sidebarNavItems = [
    {
			title: "Home",
			href: "/",
		},
		{
			title: "Page 1",
			href: "/page1",
		},
		{
			title: "Page 2",
			href: "/paeg2",
		},
		{
			title: "Page 3",
			href: "/page3",
		},
	];
  const loginUrL = "/login?/login&redirectTo=/edit" + $page.url.pathname;
</script>

<svelte:head>
  <title>Markdoc</title>
</svelte:head>

<main>
  <Toaster position="top-center"/>
  <div class="flex justify-between items-center ">
    <SidebarNav items={sidebarNavItems} />  
    <div class="m-3">
      <UserNav/>
    </div>

  </div>
  
  <nav class=" m-4 hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
    {#if $page.data.user}
      {#if !$page.url.pathname.startsWith('/edit')}
        <div class="flex-col items-center text-center">
          <a href="/edit{$page.url.pathname}" class="menu">
            <Pencil />
          </a>  
          <div class="">Edit</div>
        </div>
            
      {/if}
  
    {/if} 
  
  </nav>
  

  <Separator class="my-4" /> 
  <div class="m-4">

    {@render children()}
  </div>
</main>

<style>
  .menu {
    @apply bg-slate-100 text-foreground hover:text-accent-foreground transition-colors ;
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