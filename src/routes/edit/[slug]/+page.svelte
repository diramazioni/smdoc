<script lang="ts">
	// import Button from './../../../lib/components/ui/button/button.svelte';
	import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
	import { AccordionItem } from "$lib/components";
  import * as Accordion from "$lib/components/ui/accordion/index.js";

	import MarkdocRenderer from '$lib/markdoc/renderer.svelte'
  import { Editor, Viewer } from 'tui-editor-svelte';
  import { onMount } from 'svelte';
  import { toast } from "svelte-sonner";

	let { data } = $props()
	let tabState = $state('edit')
  let accordionState = $state<string[]>(["meta"]);

  let editorRef = $state(); // Reference to store the component instance
  //

	async function saveMarkdown() {
    const editor = editorRef.getEditor();
    const markdownContent = editor.getMarkdown();
    const formData = new FormData();
    formData.append('updatedContent', markdownContent);

    const response = await fetch('?/save', {
					method: 'POST',
					body: formData
				});

    const result = await response.json();

    console.log(result)
		console.log('save')
    toast.success('Document saved')
	}
	onMount(() => {

	});

</script>

<Accordion.Root value={accordionState} type="multiple" class="w-full bg-muted p-2">
  <AccordionItem value="meta" title="meta">

    <form method="POST" action="?/frontmatter">
      <div class="flex max-w-full items-center m-4 space-x-3">
          <Label for="title">Title</Label>
          <Input type="text" name="title" placeholder="Title" 
            value={data.frontmatter.title} />
          <Label for="description">Description</Label>
          <Input type="text" name="description" placeholder="Description" 
            value={data.frontmatter.description} />
          <Button type="submit">Save META</Button>
        </div>
      </form>      
  </AccordionItem>
</Accordion.Root>
<Tabs.Root value={tabState} 	
	onValueChange={(v) => {
		tabState = v;
		if (v === 'view') {
			saveMarkdown()
		}
		// additional logic here.
	}}>
	<Tabs.List class="grid w-1/2 grid-cols-2">
		<Tabs.Trigger value="edit">Edit</Tabs.Trigger>
	  <Tabs.Trigger value="view" >View</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="edit">
    <Editor
    bind:this={editorRef}
    initialValue={data.md_only}
    pluginsOn={['colorSyntax', 'tableMergedCell','codeSyntaxHighlight', 'chart', 'uml']} 
    
  />

	</Tabs.Content>
	<Tabs.Content value="view">
		<MarkdocRenderer children={JSON.parse(data.children)} />
	</Tabs.Content>

  </Tabs.Root>    

  <!-- {@html data.html} -->