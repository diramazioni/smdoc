<script lang="ts">
    import { page } from '$app/stores';
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

    let showMagnifier = $state<{[key: string]: boolean}>({});
    let magnifierPosition = $state<{[key: string]: {x: number, y: number}}>({});
    let containerRef = $state<HTMLDivElement | null>(null);
    let magnifierSize = $state(200);
    let zoomLevel = $state(2);
    let imageDetails = $state<{[key: string]: {
        width: number,
        height: number,
        src: string,
        rect: DOMRect,
        offsetX: number,
        offsetY: number
    }}>({});

    let style = $derived.by(() => {
        const styles = [];
        if (width) styles.push(`--img-width: ${width}`);
        if (height) styles.push(`--img-height: ${height}`);
        return styles.join(';');
    });

    let alignClass = $derived.by(() => {
        switch(align) {
            case 'center': return 'items-center justify-center text-center';
            case 'right': return 'items-end justify-start text-right';
            default: return 'items-center justify-around ';
        }
    });

    $effect(() => {
        if (containerRef && $page.url.pathname) {  
            const images = containerRef.querySelectorAll('img');
            const containerRect = containerRef.getBoundingClientRect();
            
            images.forEach((img, index) => {
                // console.log('image-wrapper: ', img.src);
                const imgRect = img.getBoundingClientRect();
                const offsetX = imgRect.left - containerRect.left;
                const offsetY = imgRect.top - containerRect.top;
                
                imageDetails[index] = {
                    width: img.width,
                    height: img.height,
                    src: img.src,
                    rect: imgRect,
                    offsetX,
                    offsetY
                };
                magnifierPosition[index] = { x: 0, y: 0 };
                showMagnifier[index] = false;

                img.onmouseenter = () => handleMouseEnter(index);
                img.onmouseleave = () => handleMouseLeave(index);
                img.onmousemove = (e) => updateMagnifierPosition(e, index);

                const updatedRect = img.getBoundingClientRect();
                const updatedOffsetX = updatedRect.left - containerRect.left;
                const updatedOffsetY = updatedRect.top - containerRect.top;
                imageDetails[index] = {
                    width: img.width,
                    height: img.height,
                    src: img.src,
                    rect: updatedRect,
                    offsetX: updatedOffsetX,
                    offsetY: updatedOffsetY
                };
            });
        }
    });

    function updateMagnifierPosition(event: MouseEvent, imageIndex: number) {
        const details = imageDetails[imageIndex];
        if (!details) return;

        const containerRect = containerRef?.getBoundingClientRect();
        if (!containerRect) return;

        // Get mouse position relative to the container
        const containerX = event.clientX - containerRect.left;
        const containerY = event.clientY - containerRect.top;

        magnifierPosition[imageIndex] = { 
            x: containerX, 
            y: containerY 
        };
    }

    function handleMouseEnter(imageIndex: number) {
        if (magnifier) {
            showMagnifier[imageIndex] = true;
        }
    }

    function handleMouseLeave(imageIndex: number) {
        showMagnifier[imageIndex] = false;
    }

    function getMagnifierStyle(index: string) {
        const details = imageDetails[index];
        const pos = magnifierPosition[index];
        if (!details || !pos) return '';

        // Calculate the relative position within the image
        const relativeX = pos.x - details.offsetX;
        const relativeY = pos.y - details.offsetY;

        return `
            width: ${magnifierSize}px; 
            height: ${magnifierSize}px;
            left: ${pos.x - magnifierSize/2}px;
            top: ${pos.y - magnifierSize/2}px;
            background-position: 
                ${-relativeX * zoomLevel + magnifierSize/2}px 
                ${-relativeY * zoomLevel + magnifierSize/2}px;
            background-image: url('${details.src}');
            background-size: ${details.rect.width * zoomLevel}px ${details.rect.height * zoomLevel}px;
        `;
    }
</script>

<div 
    class="images-container flex flex-wrap gap-4 {alignClass}"
    {style}
    bind:this={containerRef}
>
    {@render children()}
    {#each Object.entries(showMagnifier) as [index, show]}
        {#if show && imageDetails[index]}
            <div 
                class="magnifier"
                style={getMagnifierStyle(index)}
            ></div>
        {/if}
    {/each}
</div>

<style>
    .images-container {
        width: 100%;
        position: relative;
    }

    :global(.images-container img) {
        width: var(--img-width, auto);
        height: var(--img-height, auto);
        object-fit: contain;
        display: block;
        cursor: zoom-in;
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
</style>