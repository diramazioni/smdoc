<script lang="ts">
    let { children, gap = '4' }: any = $props();
  </script>
  
  <div class="flex flex-wrap items-start gap-{gap}">
    {@render children()}
  </div>