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
        if (width) styles.push(`--img-width: ${width}`);
        if (height) styles.push(`--img-height: ${height}`);
        return styles.join(';');
    });

    let alignClass = $derived.by(() => {
        switch(align) {
            case 'center': return 'mx-auto';
            case 'right': return 'ml-auto';
            default: return '';
        }
    });
</script>

<!-- Add image-container class for easier targeting -->
<div class="image-container {alignClass}" {style}>
    {@render children()}
</div>

<style>
    .image-container {
        display: inline-block;
    }
    
    /* Try multiple selector approaches */
    :global(.image-container > img) {
        width: var(--img-width, auto);
        height: var(--img-height, auto);
        object-fit: contain;
        display: block;
    }

    :global(.image-container p > img) {
        width: var(--img-width, auto);
        height: var(--img-height, auto);
        object-fit: contain;
        display: block;
    }

    /* Debug style to make it obvious when selector works */
    :global(.image-container img) {
        border: 2px solid #eee;
    }
</style>