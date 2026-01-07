import { Letta } from '@letta-ai/letta-client';

// Singleton pattern per il client Letta
let lettaClient: Letta | null = null;

export function getLettaClient(): Letta {
  if (!lettaClient) {
    // Nota: In SvelteKit backend usiamo process.env o import.meta.env
    // In src/lib solitamente si usa secret/private env if needed, 
    // ma qui seguiamo il piano che usa VITE_ prefix o LETTA_API_KEY
    const apiKey = process.env.LETTA_API_KEY || import.meta.env.VITE_LETTA_API_KEY;

    lettaClient = new Letta({
      apiKey: apiKey,
      // baseUrl: process.env.LETTA_BASE_URL // se self-hosted
    });
  }
  return lettaClient;
}
