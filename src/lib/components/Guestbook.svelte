<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea"; 
    import { toast } from "svelte-sonner";
    import type { GuestbookEntry } from '$lib/api';
    import { onMount } from "svelte";
  
    let name = $state("");
    let email = $state("");
    let content = $state("");
    let messages = $state<GuestbookEntry[]>([]);
  
    async function loadMessages() {
      const response = await fetch('/api/guestbook');
      if (response.ok) {
        messages = await response.json();
      } else {
        toast.error('Failed to load messages');
      }
    }
  
    async function handleSubmit(event: Event) {
      event.preventDefault();
      
      try {
        const response = await fetch('/api/guestbook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, content })
        });
  
        if (!response.ok) throw new Error('Failed to submit message');
  
        const result = await response.json();
        
        if (result.success) {
          toast.success('Message sent successfully!');
          name = "";
          email = "";
          content = "";
          await loadMessages();
        }
      } catch (err) {
        toast.error('Failed to submit message');
        console.error(err);
      }
    }
    
    onMount(() => {
  
    // Load messages on mount
    // $effect(() => {
      loadMessages();
    });
  </script>

<h2 class="text-2xl font-semibold mb-6 text-center">Lascia un messaggio</h2>
  
  <div class="w-full max-w-2xl mx-auto p-4">
    <form class="space-y-4 mb-8" onsubmit={handleSubmit}>
      <div>
        <Label for="name">Nome</Label>
        <Input type="text" id="name" bind:value={name} required />
      </div>
      
      <div>
        <Label for="email">Email</Label>
        <Input type="email" id="email" bind:value={email} required />
      </div>
      
      <div>
        <Label for="message">Messaggio</Label>
        <Textarea 
          id="message" 
          bind:value={content}
          placeholder="Leave a message..."
          required
          rows={4}
        />
      </div>
  
      <Button type="submit">Lascia un messaggio</Button>
    </form>
  
    <div class="space-y-4">
      <h3 class="text-xl font-semibold">Messaggi recenti</h3>
      
      {#if messages.length === 0}
        <p class="text-muted-foreground">Non ci sono messaggi, lasciane uno tu!</p>
      {/if}
  
      {#each messages as message}
        <div class="bg-card p-4 rounded-lg border">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h4 class="font-medium">{message.name}</h4>
              <p class="text-sm text-muted-foreground">{message.email}</p>
            </div>
            <time class="text-sm text-muted-foreground">
              {new Date(message.date).toLocaleDateString()}
            </time>
          </div>
          <p class="text-sm">{message.content}</p>
        </div>
      {/each}
    </div>
  </div>