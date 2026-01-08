// utility per "scoprire" quali nuovi tools mette a disposizione la piattaforma Letta (che è in continua evoluzione) senza dover consultare ogni volta la documentazione o fare chiamate manuali.
import { Letta } from '@letta-ai/letta-client';
import dotenv from 'dotenv';
dotenv.config();

async function listTools() {
  const client = new Letta({
    apiKey: process.env.LETTA_API_KEY || process.env.VITE_LETTA_API_KEY,
    baseUrl: process.env.LETTA_BASE_URL || 'https://api.letta.com'
  });

  try {
    const tools = await client.tools.list();
    console.log('Available tools:');
    tools.items.forEach(t => {
      if (t.name.includes('search_file')) {
        console.log(`- ${t.name}: ${t.description}`);
      }
    });
  } catch (err) {
    console.error('Error listing tools:', err);
  }
}

listTools();
