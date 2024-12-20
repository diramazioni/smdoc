<script lang="ts">
  import * as Accordion from "$lib/components/ui/accordion/index.js";

	let { children, title='', color = 'default', open=false }: any = $props()

  let accordionOpen = $derived(open ? title : '')
</script>
	<Accordion.Root value={accordionOpen} type="single" >
		<Accordion.Item value={title} >
			<div class="accordion {color}">
				<Accordion.Trigger >
					{title}
				</Accordion.Trigger>
      </div>
			<div class="accordion-content">
				<Accordion.Content>
					{@render children()}
				</Accordion.Content>
      </div>
		</Accordion.Item>
	</Accordion.Root>

<style>
	.accordion {
		@apply text-lg font-semibold  p-2 m-3 rounded-lg border border-border ;
	}
	.accordion-content {
		@apply m-3  shadow-md;
	}
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
