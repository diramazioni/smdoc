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
    console.log('Fetching available tools from platform...');
    const allTools = await client.tools.list();
    const toolMap = new Map();
    allTools.items.forEach(t => toolMap.set(t.name, t.id));

    const toolIdsToAttach = LETTA_CONFIG_TOOLS
      .map(name => {
        const id = toolMap.get(name);
        if (!id) console.warn(`Warning: Tool "${name}" not found on platform.`);
        return id;
      })
      .filter(id => !!id);

    console.log('Tool IDs to attach:', toolIdsToAttach);

    console.log('Fetching agents...');
    const agentsPage = await client.agents.list({
      tags: ['smdr-cms']
    });

    console.log(`Found ${agentsPage.items.length} agents to update.`);

    for (const agent of agentsPage.items) {
      console.log(`Updating agent: ${agent.name} (${agent.id})...`);
      
      // Get currently attached tools to avoid duplicates if necessary, 
      // though attach might be idempotent
      const currentToolsPage = await client.agents.tools.list(agent.id);
      const currentToolIds = currentToolsPage.items.map(t => t.id);

      for (const toolId of toolIdsToAttach) {
        if (!currentToolIds.includes(toolId)) {
          console.log(`Attaching tool ID ${toolId} to agent ${agent.id}...`);
          await client.agents.tools.attach(toolId, { agent_id: agent.id });
        } else {
          console.log(`Tool ID ${toolId} already attached.`);
        }
      }
      
      // Final check
      const finalToolsPage = await client.agents.tools.list(agent.id);
      const finalToolNames = finalToolsPage.items.map(t => t.name);
      console.log(`Final tools for ${agent.name}:`, finalToolNames);
      
      const missing = LETTA_CONFIG_TOOLS.filter(name => !finalToolNames.includes(name));
      if (missing.length > 0) {
        console.error(`ERROR: Some tools were NOT attached to ${agent.name}:`, missing);
      } else {
        console.log(`Successfully updated ${agent.name} with all tools.`);
      }
    }

    console.log('All agents updated.');
  } catch (err) {
    console.error('Error syncing agent tools:', err);
  }
}

syncAgentTools();
