<script lang="ts">
	import { AccordionItem } from "$lib/components";
    import * as Accordion from "$lib/components/ui/accordion/index.js";
</script>
 
<Accordion.Root value={["item-1", "item-2"]} type="multiple" class="w-full sm:max-w-[70%]">
	<AccordionItem value="item-1" title="Item 1">Content 1</AccordionItem>
	<AccordionItem value="item-2" title="Item 2">Content 2</AccordionItem>
	<AccordionItem title="Item 3">Content 3</AccordionItem>
</Accordion.Root>