<script lang="ts">
    import Autoplay from "embla-carousel-autoplay";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Carousel from "$lib/components/ui/carousel/index.js";
  
    let { 
      delay = 5000,
      height = "400px",
      children 
    } = $props();
  
    const plugin = Autoplay({ delay: delay, stopOnMouseEnter: true });
  
    function findImages(content: any): Array<{src: string, alt: string}> {
      $inspect(content);
      // If it's an image node, return its info
      if (content?.name === 'img') {
        return [{
          src: content.attributes?.src || '',
          alt: content.attributes?.alt || ''
        }];
      }
      
      // If it has children, search them
      if (Array.isArray(content)) {
        return content.flatMap(findImages);
      }
  
      // If it's a node with children property, search those children
      if (content?.children) {
        return findImages(content.children);
      }
  
      return [];
    }
  
    let images = $derived.by(() => {
      return findImages(children);
    });
  </script>
  
  <div class="justify-center flex">    
    <Carousel.Root
      plugins={[plugin]}
      class="w-full"
      style="max-height: {height}"
      onmouseenter={plugin.stop}
      onmouseleave={plugin.reset} 
    >
      <Carousel.Content>
        {#each images as image}
          <Carousel.Item>
            <Card.Root>
              <Card.Content class="flex items-center justify-center p-2">
                <img 
                  src={image.src} 
                  alt={image.alt} 
                  class="max-h-[{height}] object-contain" 
                />
              </Card.Content>
            </Card.Root>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
      <Carousel.Previous />
      <Carousel.Next />
    </Carousel.Root>
  </div>