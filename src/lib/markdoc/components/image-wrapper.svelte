<script lang="ts">
    let { 
        width = undefined,
        height = undefined,
        align = 'left',
        magnifier = false,
        children 
    }: {
        width?: string;
        height?: string;
        align?: 'left' | 'center' | 'right';
        magnifier?: boolean;
        children: any;
    } = $props();

    let showMagnifier = $state(false);
    let magnifierPosition = $state({ x: 0, y: 0 });
    let containerRef = $state<HTMLDivElement | null>(null);
    let magnifierSize = $state(200); // Size of the magnifier lens
    let zoomLevel = $state(2); // Zoom magnification level
    let imageWidth = $state(0);
    let imageSrc = $state(0);

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

    $effect(() => {
        if (containerRef) {
            const img = containerRef.querySelector('img');
            if (img) {
                // If image is already loaded, get its width
                if (img.complete) {
                    imageWidth = img.width;
                    imageSrc = img.src;
                }

            }
        }
    });

    function updateMagnifierPosition(event: MouseEvent) {
        if (!containerRef) return;

        const rect = containerRef.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate magnifier position, ensuring it stays within bounds
        const magnifierHalf = magnifierSize / 2;
        magnifierPosition = {
            x: Math.max(magnifierHalf, Math.min(x, rect.width - magnifierHalf)),
            y: Math.max(magnifierHalf, Math.min(y, rect.height - magnifierHalf))
        };
    }

    function handleMouseEnter() {
        if (magnifier) {
            showMagnifier = true;
        }
    }

    function handleMouseLeave() {
        showMagnifier = false;
    }

</script>

<div 
    class="image-container {alignClass}" 
    {style}
    role="img"
    bind:this={containerRef}
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onmousemove={updateMagnifierPosition}
>
    <div class="relative">
        {@render children()}
        {#if showMagnifier}
            <div 
                class="magnifier"
                style="
                    width: {magnifierSize}px; 
                    height: {magnifierSize}px;
                    left: {magnifierPosition.x - magnifierSize/2}px;
                    top: {magnifierPosition.y - magnifierSize/2}px;
                    background-position: 
                        {-magnifierPosition.x * zoomLevel + magnifierSize/2}px 
                        {-magnifierPosition.y * zoomLevel + magnifierSize/2}px;
                    background-size: {imageWidth * zoomLevel}px;
                    background-image: url('{imageSrc}');
                "
            ></div>
        {/if}
    </div>
</div>

<style>
    .image-container {
        display: inline-block;
        position: relative;
    }

    :global(.image-container img) {
        width: var(--img-width, auto);
        height: var(--img-height, auto);
        object-fit: contain;
        display: block;
    }

    .magnifier {
        position: absolute;
        border: 2px solid #ffffff;
        border-radius: 50%;
        cursor: none;
        background-repeat: no-repeat;
        box-shadow: 0 0 0 1px rgba(0,0,0,0.3), 
                    0 4px 10px rgba(0,0,0,0.15);
        pointer-events: none;
        z-index: 10;
    }

    .relative {
        position: relative;
    }
</style>