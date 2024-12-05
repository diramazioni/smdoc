
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  let data = $state();
  let paras = $state(50);

  onMount(async () => {
    await fetchData();
  });

  async function fetchData() {
    data = await fetch(`https://baconipsum.com/api/?type=all-meat&paras=${paras}`).then((x) => x.json());
  }

  async function handleSave(event: Event) {
    event.preventDefault();
    const updatedContent = (event.target as HTMLFormElement).content.value;
    const formData = new FormData();
    formData.append('updatedContent', updatedContent);
    const response = await fetch('?/save', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    if (result.type === 'success') {
      console.log('Document saved');
    } else {
      console.error(`Error saving document: ${result.message}`);
    }
  }

  function handleParasChange(event: Event) {
    paras = parseInt((event.target as HTMLInputElement).value);
    fetchData();
  }
</script>

<form onsubmit={handleSave}>
  <div>
    <label for="paras">Number of paragraphs:</label>
    <input type="number" id="paras" name="paras" bind:value={paras} onchange={handleParasChange} min="1" max="100">
  </div>
  <div>
    <label for="content">Content:</label>
    <textarea id="content" name="content" rows="10" cols="80">{data}</textarea>
  </div>
  <button type="submit">Save</button>
</form>


<style>
  form {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  div {
    margin-bottom: 20px;
  }

  label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
  }

  input[type="number"],
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
    background-color: #FFF;
  }

  button {
    display: block;
    width: 100%;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
</style>
