<script lang="ts">
    import { cubicInOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { cn } from "$lib/utils";
    import { page } from "$app/stores";
    import { ChevronDown, ChevronRight, Menu, CircleX } from 'lucide-svelte';
    import { Button } from "$lib/components/ui/button";
  
    interface NavItem {
      href?: string;
      title: string;
      img?: string;
      children?: NavItem[];
    }
  
    let { 
      class: className = undefined,
      items 
    } = $props<{
      class?: string | undefined | null;
      items: NavItem[];
    }>();
  
    let openSections = $state<Record<string, boolean>>({});
    let isSidebarOpen = $state(false);
  
    const [send, receive] = crossfade({
      duration: 250,
      easing: cubicInOut,
    });
  
    function isActive(href: string | undefined) {
      if (!href) return false;
      return href.startsWith($page.url.pathname);
    }
  
    function toggleSection(title: string) {
      openSections[title] = !openSections[title];
    }
  
    function toggleSidebar() {
      isSidebarOpen = !isSidebarOpen;
    }

    function closeSidebar() {
      isSidebarOpen = false;
    }
</script>
  
<div class="relative">
  <!-- Mobile toggle button -->
  <div 
    variant="ghost"
    class="lg:hidden fixed top-4 right-4 z-50"
    onclick={toggleSidebar}
  >
    {#if isSidebarOpen}
      <CircleX class="h-6 w-6" />
    {:else}
      <Menu class="h-6 w-6" />
    {/if}
  </div>
  
  <!-- Sidebar -->
  <nav class={cn(
    "fixed lg:static top-0 left-0 h-full bg-background transition-transform duration-300 ease-in-out",
    !isSidebarOpen && "-translate-x-full lg:translate-x-0",
    "w-64 lg:w-auto",
    "border-r lg:border-none",
    "z-40",
    className
  )}>
    <div class="flex flex-col gap-2 p-4">
      {#each items as item}
        {#if item.children && item.children.length > 0}
          <div class="space-y-2">
            <Button
              variant="ghost"
              class="w-full flex justify-between items-center"
              onclick={() => toggleSection(item.title)}
            >
              <span>{item.title}</span>
              {#if openSections[item.title]}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </Button>
            
            {#if openSections[item.title]}
              <div class="ml-4 space-y-2">
                {#each item.children as child}
                  <a
                    href={child.href}
                    onclick={closeSidebar}
                    class={cn(
                      "flex items-center gap-3 p-2 rounded-md transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive(child.href) ? "bg-muted" : "bg-transparent"
                    )}
                  >
                    {#if child.img}
                      <img 
                        src={child.img} 
                        alt={child.title}
                        class="h-12 w-12 object-contain"
                      />
                    {/if}
                    <span>{child.title}</span>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {:else if item.href}
          <a
            href={item.href}
            onclick={closeSidebar}
            class={cn(
              "flex items-center gap-3 p-2 rounded-md transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive(item.href) ? "bg-muted" : "bg-transparent"
            )}
          >
            {#if item.img}
              <img 
                src={item.img} 
                alt={item.title}
                class="h-12 w-12 object-contain"
              />
            {/if}
            <span>{item.title}</span>
          </a>
        {/if}
      {/each}
    </div>
  </nav>
  
  <!-- Overlay for mobile -->
  {#if isSidebarOpen}
    <div 
      class="fixed inset-0 bg-black/50 lg:hidden z-30"
      onclick={toggleSidebar}
    />
  {/if}
</div>
  
<style>
  nav {
    max-width: 300px;
    min-width: 200px;
  }
</style>