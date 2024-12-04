<script lang="ts">
	import type { Snippet } from "svelte";
	import {  type WithoutChild } from "bits-ui";
    import * as Dialog from "$lib/components/ui/dialog/index.js";

	type Props = Dialog.RootProps & {
		trigger: string;
		title: Snippet;
		description: Snippet;
		contentProps?: WithoutChild<Dialog.ContentProps>;
		// ...other component props if you wish to pass them
	};
 
	let {
		open = $bindable(false),
		children,
		trigger,
		contentProps,
		title,
		description,
		...restProps
	}: Props = $props();
</script>
 
<Dialog.Root bind:open {...restProps}>
	<Dialog.Trigger>
		{@render trigger()}
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content {...contentProps}>
			<Dialog.Title>
				{@render title()}
			</Dialog.Title>
			<Dialog.Description>
				{@render description()}
			</Dialog.Description>
			{@render children?.()}
			<Dialog.Close>Close Dialog</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>