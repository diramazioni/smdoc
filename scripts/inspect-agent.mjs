
import { Letta } from '@letta-ai/letta-client';
import dotenv from 'dotenv';
dotenv.config();

async function inspectAgent() {
  const client = new Letta({
    apiKey: process.env.LETTA_API_KEY || process.env.VITE_LETTA_API_KEY,
    baseUrl: process.env.LETTA_BASE_URL || 'https://api.letta.com'
  });

  try {
    const agentsPage = await client.agents.list({
      tags: ['smdr-cms']
    });

    if (agentsPage.items.length === 0) {
      console.log('No agents found.');
      return;
    }

    const agent = agentsPage.items[0];
    console.log('--- Agent Inspection ---');
    console.log(`Name: ${agent.name}`);
    console.log(`ID: ${agent.id}`);
    
    const requiredTools = [
      'semantic_search_files',
      'conversation_search',
      'open_files',
      'grep_files'
    ];

    console.log('All tools in agent:');
    agent.tools.forEach(t => {
      console.log(`- ${t.name || t}`);
    });

    const missing = requiredTools.filter(rt => !agent.tools.some(t => (t.name || t) === rt));
    if (missing.length > 0) {
      console.log('Missing tools:', missing);
    } else {
      console.log('All required tools are present.');
    }

  } catch (err) {
    console.error('Error inspecting agent:', err);
  }
}

inspectAgent();
