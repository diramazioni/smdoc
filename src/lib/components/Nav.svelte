<script lang="ts">
  import { cubicInOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import { cn } from "$lib/utils.js";
  import { page } from "$app/stores";
  import { Menu, CircleX } from 'lucide-svelte';
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
  let isMobileMenuOpen = $state(false);

  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut,
  });

  function isActive(href: string | undefined) {
    if (!href) return false;
    return href.startsWith($page.url.pathname);
  }

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMenu() {
    isMobileMenuOpen = false;
  }
</script>

<div class="relative">
  <!-- Mobile menu button -->
  <button 
    class="lg:hidden"
    onclick={toggleMobileMenu}
  >
    {#if isMobileMenuOpen}
      <CircleX class="h-6 w-6" />
    {:else}
      <Menu class="h-6 w-6" />
    {/if}
  </button>

  <!-- Desktop navigation -->
  <nav class={cn(
    "hidden lg:flex flex-row space-x-4 w-full justify-end",
    className
  )}>
    {#each items as item}
      {#if item.children && item.children.length > 0}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
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
              in:send={{ key: "active-nav-tab" }}
              out:receive={{ key: "active-nav-tab" }}
            ></div>
          {/if}
          <div class="relative">
            {item.title}
          </div>
        </Button>
      {/if}
    {/each}
  </nav>

  <!-- Mobile navigation -->
  {#if isMobileMenuOpen}
    <nav class="absolute top-full left-0 right-0 bg-background shadow-lg lg:hidden z-50">
      <div class="flex flex-col p-4 space-y-2">
        {#each items as item}
          {#if item.children && item.children.length > 0}
            <div class="space-y-2">
              <div class="font-semibold">{item.title}</div>
              {#each item.children as child}
                <a
                  href={child.href}
                  onclick={closeMenu}
                  class={cn(
                    "block pl-4 py-2 hover:bg-accent rounded-md",
                    isActive(child.href) && "font-semibold bg-muted"
                  )}
                >
                  {child.title}
                </a>
              {/each}
            </div>
          {:else if item.href}
            <a
              href={item.href}
              onclick={closeMenu}
              class={cn(
                "block py-2 hover:bg-accent rounded-md",
                isActive(item.href) && "font-semibold bg-muted"
              )}
            >
              {item.title}
            </a>
          {/if}
        {/each}
      </div>
    </nav>
  {/if}
</div>

<style>
  nav {
    position: relative;
    z-index: 50;
  }
</style>