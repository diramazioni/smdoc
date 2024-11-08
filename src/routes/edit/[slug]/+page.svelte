<script lang="ts">
	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'

	let { data } = $props()
	console.log(data.user)
</script>
<h1>Admin</h1>
<MarkdocRenderer children={JSON.parse(data.children)} />
