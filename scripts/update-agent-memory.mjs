
import { Letta } from '@letta-ai/letta-client';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = process.env.LETTA_PROJECT_ID || 'smdr-main';

const NEW_PERSONA = 'You are a helpful assistant for the SMDR CMS. You help users manage and understand their content. Use semantic_search_files or grep_files to find information in documents when asked about content.';
const NEW_PROJECT_CONTEXT = `SMDR is a markdown-based CMS. Project ID: ${PROJECT_ID}. You have access to the project files via semantic_search_files, open_files, and grep_files.`;

async function updateAgentMemory() {
  const client = new Letta({
    apiKey: process.env.LETTA_API_KEY || process.env.VITE_LETTA_API_KEY,
    baseUrl: process.env.LETTA_BASE_URL || 'https://api.letta.com'
  });

  try {
    const agentsPage = await client.agents.list({ tags: ['smdr-cms'] });
    console.log(`Found ${agentsPage.items.length} agents to update.`);

    for (const agent of agentsPage.items) {
      console.log(`Updating memory for agent: ${agent.name} (${agent.id})...`);
      
      // Get agent's current memory blocks
      // Based on my inspect-agent.mjs output, agent.memory.blocks is the path
      const memory = agent.memory;
      if (!memory || !memory.blocks) {
        console.error(`Memory blocks not found for ${agent.name}`);
        continue;
      }

      const personaBlock = memory.blocks.find(b => b.label === 'persona');
      const projectBlock = memory.blocks.find(b => b.label === 'project_context');

      if (personaBlock) {
        console.log(`Updating Persona block (${personaBlock.id})...`);
        await client.blocks.update(personaBlock.id, { value: NEW_PERSONA });
      }

      if (projectBlock) {
        console.log(`Updating Project Context block (${projectBlock.id})...`);
        await client.blocks.update(projectBlock.id, { value: NEW_PROJECT_CONTEXT });
      }

      console.log(`Successfully updated memory for ${agent.name}.`);
    }

    console.log('All agent memories updated.');
  } catch (err) {
    console.error('Error updating agent memory:', err);
  }
}

updateAgentMemory();
