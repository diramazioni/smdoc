<script lang="ts">
	import type { Snippet } from "svelte";
	import { Dialog as DialogPrimitive, type WithoutChild } from "bits-ui";
	import * as Dialog from "$lib/components/ui/dialog/index.js";

	type Props = DialogPrimitive.RootProps & {
		trigger?: Snippet;
		title?: Snippet;
		description?: Snippet;
		contentProps?: WithoutChild<DialogPrimitive.ContentProps>;
		children?: Snippet;
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
	{#if trigger}
		<Dialog.Trigger>
			{@render trigger()}
		</Dialog.Trigger>
	{/if}
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content {...contentProps}>
			{#if title}
				<Dialog.Title>
					{@render title()}
				</Dialog.Title>
			{/if}
			{#if description}
				<Dialog.Description>
					{@render description()}
				</Dialog.Description>
			{/if}
			{@render children?.()}
			<Dialog.Close>Cancel</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
