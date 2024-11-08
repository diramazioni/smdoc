<script lang="ts">
  import "../app.css";
  import '@fontsource-variable/manrope';
  import { page } from '$app/stores';
  
  let { children } = $props()
</script>

<svelte:head>
  <title>Markdoc</title>
</svelte:head>

<main>
  <nav>
    {#if !$page.data.user}
      <a href="/login?/login&redirectTo=/edit{$page.url.pathname}">Login</a>
      <a href="/register">Register</a>
    {/if}
  
    {#if $page.data.user}
      {#if !$page.url.pathname.startsWith('/edit')}
        <a href="/edit{$page.url.pathname}">EDIT</a>
      {:else}
        <form action="/save?/save&redirectTo={$page.url.pathname}" method="POST">
          <button type="submit">Save</button>
        </form>      
      {/if}
  
      <form action="/login?/logout&redirectTo={$page.url.pathname}" method="POST">
        <button type="submit">Log out</button>
      </form>
    {/if}
  </nav>

  {@render children()}
</main>

<style>
  :global(body) {
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
  }
</style>
