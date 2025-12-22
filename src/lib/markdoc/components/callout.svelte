<script lang="ts">
	let { children, color = 'default' }: any = $props()
</script>

<div class="text-lg font-semibold p-4 m-3 rounded-lg border border-border shadow-md {color}">
	{@render children()}
</div>


<style>

	.default {
		background-color: oklch(95% 0.03 200);
		color: oklch(30% 0.03 200);
	}

	.blue {
		background-color: oklch(95% 0.05 240);
		color: oklch(30% 0.1 240);
	}

	.green {
		background-color: oklch(95% 0.05 140);
		color: oklch(30% 0.1 140);
	}

	.yellow {
		background-color: oklch(95% 0.05 90);
		color: oklch(30% 0.1 90);
	}

	.red {
		background-color: oklch(95% 0.05 20);
		color: oklch(30% 0.1 20);
	}

	.purple {
		background-color: oklch(95% 0.05 300);
		color: oklch(30% 0.1 300);
	}
</style>
