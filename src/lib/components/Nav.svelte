<script lang="ts">
  import { cubicInOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import { cn } from "$lib/utils.js";
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

  interface NavItem {
    href?: string;
    title: string;
    children?: NavItem[];
  }

  interface Props {
    class?: string | undefined | null;
    items: NavItem[];
  }

  let { class: className = undefined, items }: Props = $props();

  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut,
  });

  function isActive(href: string | undefined) {
    if (!href) return false;
    return href.startsWith($page.url.pathname);
  }
</script>

<nav class={cn("flex-col space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 sd:flex sd:flex-row sd:items-center sd:gap-5 sd:text-sm", className)}>
  {#each items as item}
    {#if item.children && item.children.length > 0}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="ghost"
            class="relative justify-start hover:bg-accent"
          >
            {item.title}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Group>
            {#each item.children as child}
              <DropdownMenu.Item>
                <a
                  href={child.href}
                  class={cn(
                    "w-full",
                    isActive(child.href) && "font-semibold"
                  )}
                >
                  {child.title}
                </a>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {:else if item.href}
      <Button
        href={item.href}
        variant="ghost"
        class={cn(
          !isActive(item.href) && "hover:underline",
          "relative justify-start hover:bg-accent",
        )}
        data-sveltekit-noscroll
      >
        {#if isActive(item.href)}
          <div
            class="bg-muted absolute inset-0 rounded-md"
            in:send={{ key: "active-sidebar-tab" }}
            out:receive={{ key: "active-sidebar-tab" }}
          ></div>
        {/if}
        <div class="relative">
          {item.title}
        </div>
      </Button>
    {/if}
  {/each}
</nav>