
import { Letta } from '@letta-ai/letta-client';
import dotenv from 'dotenv';
dotenv.config();

// Poiché Letta richiede che un folder sia esplicitamente collegato a un agente per poterlo interrogare,
// questo script sincronizza tutti gli agenti SMDR collegandoli al folder del progetto.

const PROJECT_ID = process.env.LETTA_PROJECT_ID || 'smdr-main';

async function syncAgentFolders() {
  const client = new Letta({
    apiKey: process.env.LETTA_API_KEY || process.env.VITE_LETTA_API_KEY,
    baseUrl: process.env.LETTA_BASE_URL || 'https://api.letta.com'
  });

  try {
    console.log(`Searching for project folder: project-${PROJECT_ID}...`);
    const foldersPage = await client.folders.list();
    const folder = foldersPage.items.find(f => f.name === `project-${PROJECT_ID}`);

    if (!folder) {
      console.error(`Folder project-${PROJECT_ID} not found. Please sync files first.`);
      return;
    }

    console.log(`Found folder: ${folder.name} (${folder.id})`);

    console.log('Fetching agents...');
    const agentsPage = await client.agents.list({
      tags: ['smdr-cms']
    });

    console.log(`Found ${agentsPage.items.length} agents to check.`);

    for (const agent of agentsPage.items) {
      console.log(`Checking agent: ${agent.name} (${agent.id})...`);
      
      const attachedFolders = await client.agents.folders.list(agent.id);
      
      if (!attachedFolders.items.some(f => f.id === folder.id)) {
        console.log(`Attaching folder to ${agent.name}...`);
        await client.agents.folders.attach(folder.id, { agent_id: agent.id });
        console.log(`Successfully attached folder to ${agent.name}.`);
      } else {
        console.log(`Folder already attached to ${agent.name}.`);
      }
    }

    console.log('All agents processed.');
  } catch (err) {
    console.error('Error syncing agent folders:', err);
  }
}

syncAgentFolders();
