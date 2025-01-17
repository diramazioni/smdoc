<script lang="ts">

  let { 
    children, 
    gap = '1',
    align = 'left',
    cl = '' 
  }: {
    children: any;
    gap?: string;
    align?: 'left' | 'center' | 'right';
    cl?: string;
  } = $props();

  let alignClass = $derived.by(() => {
    switch(align) {
        case 'center': return 'items-center justify-center text-center';
        case 'right': return 'items-end justify-start text-right';
        default: return 'items-start justify-start text-left';
      }
    });
</script>

<div class="flex flex-wrap gap-{gap} {alignClass} {cl}">
  {@render children()}
</div>