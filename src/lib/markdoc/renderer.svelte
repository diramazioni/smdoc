<script lang="ts">
	import { Accordion } from 'bits-ui';
    import Renderer from './renderer.svelte';
    import type { ComponentType } from 'svelte'
    import Callout from './components/callout.svelte'
    import Drop from './components/accordion.svelte'
    import Spacer from './components/spacer.svelte'

    let { children }: any = $props()
    

    const components: Record<string, ComponentType> = {
        Callout: Callout,
        Spacer: Spacer,
        Drop: Drop
    }
</script>

{#each children as child}
    {#if components[child.name]}
        {@const SvelteComponent = components[child.name]}
        <SvelteComponent {...child.attributes}>
            <Renderer children={child.children} />
        </SvelteComponent>
    {:else}

      {#if child.children}
      <svelte:element this={child.name} {...child.attributes}>
          <Renderer children={child.children} />
      </svelte:element>
      {/if}

    {/if}

    {#if typeof child === 'string'}
      {@const childSplit = child.split('"')}
      {#each childSplit as str}
        {#if str.trim().length > 0}
          {str}
        <!-- {:else}
          <br /> -->
        {/if}
      {/each}
      
      <!-- {JSON.stringify(child.split('"'))} -->

        <!-- {child} -->
    {/if}
{/each}