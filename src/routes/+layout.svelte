<script lang="ts">
  import "../app.css";
  import '@fontsource-variable/manrope';
  import { page } from '$app/stores';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  
  import MenuNav from "$lib/components/Nav.svelte";
  import SideNav from '$lib/components/SideNav.svelte';
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
    <div class="ml-3 flex-row flex items-baseline">
      <img src="/logo.png" alt="logo" class="w-20" />
      <h1 class="text-xl font-bold ml-3">DigitEco <span class="text-base font-normal">s.r.l.</span></h1> 
    </div>
    <MenuNav items={data.navmenu} />  
    <div class="m-3">
      <UserNav/>
    </div>
  </nav>
  <Separator class="" />
  <!-- <article class="prose prose-slate dark:prose-invert prose-headings:font-display prose-headings:font-normal mx-auto my-12">
  {@render children()}

  </article> -->
  {#if data.sidenav.length > 0}
  <div class="flex gap-2">
    <div class="">
    <SideNav items={data.sidenav} />  
    </div>
    <div class="w-full">
      {@render children()}
    </div>
  </div>
  {:else}
  {@render children()}
  {/if}	

      <!-- {#each $page.data.sidenav as item}
        <div class="flex flex-col gap-2">
          <a href={item.url} class="menu">{item.title}</a>
        </div>
      {/each} -->


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