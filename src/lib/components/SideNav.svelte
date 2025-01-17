<!-- src/lib/components/SideNav.svelte -->
<script lang="ts">
    import { cubicInOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { cn } from "$lib/utils";
    import { page } from "$app/stores";
    import SideNav from "./SideNav.svelte";
    
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

    const [send, receive] = crossfade({
        duration: 250,
        easing: cubicInOut,
    });

    function isActive(href: string | undefined) {
        if (!href) return false;
        return href.startsWith($page.url.pathname);
    }
</script>

<nav class={cn("flex flex-col gap-2 p-4", className)}>
    {#each items as item}
        {#if item.children && item.children.length > 0}
            <div class="ml-4">
                <SideNav items={item.children} />
            </div>
        {:else if item.href}
            <a href={item.href}
                class={cn(
                    "flex items-center gap-3 p-2 rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive(item.href) ? "bg-muted" : "bg-transparent"
                )}
            >
                {#if isActive(item.href)}
                    <div
                        class="bg-muted absolute inset-0 rounded-md"
                        in:send={{key: "active-sidenav-tab"}}
                        out:receive={{key: "active-sidenav-tab"}}
                    ></div>
                {/if}
                {#if item.img}
                    <img 
                        src={item.img} 
                        alt={item.title}
                        class="h-12 w-12 object-contain relative"
                    />
                {/if}
                <span class="relative z-10">{item.title}</span>
            </a>
        {/if}
    {/each}
</nav>

<style>
    nav {
        max-width: 300px;
        min-width: 200px;
    }
    
    a {
        position: relative;
        overflow: hidden;
    }
</style>