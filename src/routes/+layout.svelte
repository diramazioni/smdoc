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
	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'
  
  let { children, data } = $props()

  const title = function() {
    if($page.data.frontmatter) {
      return $page.data.frontmatter.title
    } else {
      return 'Welcome'
    }
  }

</script>
  <svelte:head>
    <title>{title()}</title>
  </svelte:head>


<main>
  <Toaster position="top-center"/>
  <nav class="ml-3 flex justify-between items-center ">
    <h1 class="text-xl font-bold">DigitEco <span class="text-base font-normal">s.r.l.</span></h1> 
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
{#if $page.data.footer}
<div style="margin-top: 100px">
</div>
<div id="footer" class="fixed bottom-0 left-0 right-0 ml-4 mr-4 p-2 w-full space-y-0.5 justify-center items-center text-center bg-gradient-to-b from-transparent to-white" >
  <MarkdocRenderer children={JSON.parse($page.data.footer)} />
</div>
{/if}	
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