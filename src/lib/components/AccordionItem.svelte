<script lang="ts">
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import { FileCode } from 'lucide-svelte';

	type Props =  {
		title: string;
		children: any;
	};
 
	let { title, children, ...restProps }: Props = $props();
</script>
 
<Accordion.Item {...restProps} >
    <Accordion.Trigger>
        <FileCode />
        {title}
    </Accordion.Trigger>
	<Accordion.Content>
		{@render children()}
	</Accordion.Content>
</Accordion.Item>