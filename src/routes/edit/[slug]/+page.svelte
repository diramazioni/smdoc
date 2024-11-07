<script lang="ts">
	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'

	let { data } = $props()
</script>
<h1>Admin</h1>
<MarkdocRenderer children={JSON.parse(data.children)} />
