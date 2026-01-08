import { Letta } from '@letta-ai/letta-client';

// Singleton pattern per il client Letta
let lettaClient: Letta | null = null;

const DEFAULT_BASE_URL = 'https://api.letta.com';

export function getLettaBaseUrl(): string {
  return process.env.LETTA_BASE_URL || import.meta.env.VITE_LETTA_BASE_URL || DEFAULT_BASE_URL;
}

export function isSelfHosted(): boolean {
  const baseUrl = getLettaBaseUrl();
  return baseUrl !== DEFAULT_BASE_URL && !baseUrl.includes('api.letta.com');
}

export function getLettaClient(): Letta {
  if (!lettaClient) {
    const apiKey = process.env.LETTA_API_KEY || import.meta.env.VITE_LETTA_API_KEY;
    const baseUrl = getLettaBaseUrl();

    lettaClient = new Letta({
      apiKey: apiKey,
      baseUrl: baseUrl
    });
  }
  return lettaClient;
}
