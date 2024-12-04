<script lang="ts">
  import Autoplay from "embla-carousel-autoplay";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Carousel from "$lib/components/ui/carousel/index.js";
    
  
  interface Props {
    class?: string | undefined | null;
    links: { href: string; title: string }[];
    delay? : number;
  }
  
  let { class: className = undefined, links, delay = 5000 }: Props = $props();
  const plugin = Autoplay({ delay: delay, stopOnInteraction: false });
  

</script>
<div class="justify-center flex">    
<Carousel.Root
plugins={[plugin]}
class="w-full max-w-screen-xl"
onmouseenter={plugin.stop}
onmouseleave={plugin.reset} 
>
  <Carousel.Content>
    {#each links as link}
    <Carousel.Item>
      <Card.Root>
        <Card.Content class="flex items-center justify-center p-2" >
        <img src={link.href} alt={link.title} class="h-full w-full object-contain" />
        </Card.Content>
      </Card.Root>
    </Carousel.Item>
    {/each}
  </Carousel.Content>
  <Carousel.Previous />
  <Carousel.Next />
</Carousel.Root>
</div>