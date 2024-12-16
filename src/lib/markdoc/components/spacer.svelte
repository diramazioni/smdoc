<script lang="ts">
	let { children, h = '1' }: any = $props()
</script>

<div style={`margin-top: ${h}px`}>
	{@render children()}
</div>
