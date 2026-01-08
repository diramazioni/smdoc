// Poiché Letta "congela" i tool a disposizione di un agente al momento della sua creazione, avrai bisogno di questo script ogni volta che deciderai di aggiungere nuovi tool in futuro per aggiornare gli agenti già esistenti senza doverli ricreare da zero.
import { Letta } from '@letta-ai/letta-client';
import dotenv from 'dotenv';
dotenv.config();

const LETTA_CONFIG_TOOLS = [
  'archival_memory_insert', 
  'archival_memory_search', 
  'semantic_search_files', 
  'conversation_search',
  'open_files',
  'grep_files'
];

async function syncAgentTools() {
  const client = new Letta({
    apiKey: process.env.LETTA_API_KEY || process.env.VITE_LETTA_API_KEY,
    baseUrl: process.env.LETTA_BASE_URL || 'https://api.letta.com'
  });

  try {
    console.log('Fetching agents...');
    const agentsPage = await client.agents.list({
      tags: ['smdr-cms']
    });

    console.log(`Found ${agentsPage.items.length} agents to update.`);

    for (const agent of agentsPage.items) {
      console.log(`Updating agent: ${agent.name} (${agent.id})...`);
      
      await client.agents.update(agent.id, {
        tools: LETTA_CONFIG_TOOLS
      });
      
      console.log(`Successfully updated ${agent.name}.`);
    }

    console.log('All agents updated.');
  } catch (err) {
    console.error('Error syncing agent tools:', err);
  }
}

syncAgentTools();
