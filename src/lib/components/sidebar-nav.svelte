<script lang="ts">
  import { cubicInOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import { cn } from "$lib/utils.js";
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";

  let className: string | undefined | null = undefined;
  export let items: { href: string; title: string }[];
  export { className as class };

  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut,
  });
</script>

<nav
  class={cn("flex-col space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 sd:flex sd:flex-row sd:items-center sd:gap-5 sd:text-sm", className)}
>
  {#each items as item}
    {@const isActive = item.href.startsWith($page.url.pathname) }
    <Button
      href={item.href}
      variant="ghost"
      class={cn(
        !isActive && "hover:underline",
        "relative justify-start hover:bg-accent",
      )}
      data-sveltekit-noscroll>
      {#if isActive}
        <div class="bg-muted absolute inset-0 rounded-md"
          in:send={{ key: "active-sidebar-tab" }}
          out:receive={{ key: "active-sidebar-tab" }}
        ></div>
      {/if}
      <div class="relative">
        {item.title}
      </div>
    </Button>
  {/each}
</nav>
