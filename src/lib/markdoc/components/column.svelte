<script lang="ts">
    let { children, w = '100', align = 'left' }: any = $props();
    
    // Convert width percentage to Tailwind flex-basis class
    let basisClass = $derived.by(() => {
      const width = parseInt(w);
      
      // Common percentage mappings
      if (width === 100) return 'basis-full';
      if (width === 80) return 'basis-4/5';
      if (width === 75) return 'basis-3/4';
      if (width === 66) return 'basis-2/3';
      if (width === 60) return 'basis-3/5';
      if (width === 50) return 'basis-1/2';
      if (width === 40) return 'basis-2/5';
      if (width === 33) return 'basis-1/3';
      if (width === 25) return 'basis-1/4';
      if (width === 20) return 'basis-1/5';
      
      // Fallback to 12ths for other values
      if (width <= 8) return 'basis-1/12';
      if (width <= 16) return 'basis-2/12';
      if (width <= 25) return 'basis-3/12';
      if (width <= 33) return 'basis-4/12';
      if (width <= 41) return 'basis-5/12';
      if (width <= 50) return 'basis-6/12';
      if (width <= 58) return 'basis-7/12';
      if (width <= 66) return 'basis-8/12';
      if (width <= 75) return 'basis-9/12';
      if (width <= 83) return 'basis-10/12';
      if (width <= 91) return 'basis-11/12';
      
      return 'basis-full';
    });
  
    // Get alignment classes
    let alignClass = $derived.by(() => {
      switch(align) {
        case 'center': return 'flex flex-col items-center justify-center text-center';
        case 'right': return 'flex flex-col items-end justify-start text-right';
        default: return 'flex flex-col items-start justify-start text-left';
      }
    });
  </script>
  
  <div class="flex-initial min-w-0 {basisClass} {alignClass}">
    {@render children()}
  </div>
  
  <style>
    div {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  </style>