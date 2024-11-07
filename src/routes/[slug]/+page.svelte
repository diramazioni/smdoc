<script lang="ts">
	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'

	let { data } = $props()
</script>

<MarkdocRenderer children={JSON.parse(data.children)} />
	<form action="?/login" method="POST">
		<button type="submit" class="btn btn-primary">Login</button>
	<a href="/edit/markdoc" class="btn btn-secondary">EDIT</a>
		<button class="btn btn-primary" formaction="?/logout">Logout</button>
	</form>