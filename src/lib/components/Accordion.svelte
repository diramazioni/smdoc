<script lang="ts">
	import { Accordion, type WithoutChildrenOrChild } from "bits-ui";
	import AccordionItem from "$lib/components/AccordionItem.svelte";
 
	type Item = {
		value?: string;
		title: string;
		content: string;
		disabled?: boolean;
	};
 
	let {
		value = $bindable(),
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<Accordion.RootProps> & {
		items: Item[];
	} = $props();
</script>
 
<Accordion.Root bind:value bind:ref {...restProps as any}>
	{#each items as item, i (item.title + i)}
		<AccordionItem {...item} />
	{/each}
</Accordion.Root>