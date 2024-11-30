<script lang="ts">
  import "../app.css";
  import '@fontsource-variable/manrope';
  import { page } from '$app/stores';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";

  import SidebarNav from "$lib/components/Nav.svelte";
  import UserNav from "$lib/components/User-nav.svelte";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  
  let { children, data } = $props()

 
</script>

<svelte:head>
  <title>Markdoc</title>
</svelte:head>

<main>
  <Toaster position="top-center"/>
  <nav class="ml-3 flex justify-between items-center ">
    <SidebarNav items={data.items} />  
    <div class="m-3">
      <UserNav/>
    </div>
  </nav>
  <Separator class="" />
  <!-- <article class="prose prose-slate dark:prose-invert prose-headings:font-display prose-headings:font-normal mx-auto my-12">
  {@render children()}

  </article> -->

    {@render children()}


</main>

<style>
  /* .menu {
    @apply bg-slate-100 text-foreground hover:text-accent-foreground transition-colors ;
  } */

  
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