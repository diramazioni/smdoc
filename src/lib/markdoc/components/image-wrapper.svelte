<script lang="ts">
    let { 
        width = undefined,
        height = undefined,
        align = 'left',
        children 
    }: {
        width?: string;
        height?: string;
        align?: 'left' | 'center' | 'right';
        children: any;
    } = $props();

    let style = $derived.by(() => {
        const styles = [];
        if (width) styles.push(`width: ${width}`); else styles.push('width: auto');
        if (height) styles.push(`height: ${height}`); else styles.push('height: auto');
        return styles.join(';');
    });

    let alignClass = $derived.by(() => {
        switch(align) {
            case 'center': return 'mx-auto block';
            case 'right': return 'ml-auto block';
            default: return 'block';
        }
    });
</script>

<div class={alignClass} {style}>
    {@render children()}
</div>

<style>
    div :global(img) {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
</style>