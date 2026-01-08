
import { Letta } from '@letta-ai/letta-client';
import fs from 'node:fs';
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

async function updateAndSave() {
  const client = new Letta({
    apiKey: process.env.LETTA_API_KEY || process.env.VITE_LETTA_API_KEY,
    baseUrl: process.env.LETTA_BASE_URL || 'https://api.letta.com'
  });

  try {
    const agentsPage = await client.agents.list({ tags: ['smdr-cms'] });
    const agent = agentsPage.items[0];
    const updateRes = await client.agents.update(agent.id, {
      tools: LETTA_CONFIG_TOOLS
    });
    fs.writeFileSync('agent_update_debug.json', JSON.stringify(updateRes, null, 2));
    console.log('Saved update response to agent_update_debug.json');
  } catch (err) {
    console.error(err);
  }
}

updateAndSave();
