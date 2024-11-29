<script lang="ts">
    let items = $props();
    //console.log(JSON.stringify(items));
</script>

<div class="navbar bg-base-100">
  <div class="flex-none">
    <button class="btn btn-square btn-ghost" aria-label="S menu">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block h-5 w-5 stroke-current">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>
  </div>
  <div class="flex-1">
    {#each items.items as item}
      <a class="btn btn-ghost text-xl" href="{item.name}">{item.title}</a>
    {/each}
  </div>

</div>


