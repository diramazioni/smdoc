
import { Letta } from '@letta-ai/letta-client';
import dotenv from 'dotenv';
dotenv.config();

function exploreSDK() {
  const client = new Letta({ apiKey: 'dummy', baseUrl: 'https://api.letta.com' });
  
  let obj = client.agents.folders;
  let methods = new Set();
  while (obj) {
    Object.getOwnPropertyNames(obj).forEach(prop => methods.add(prop));
    obj = Object.getPrototypeOf(obj);
  }
  console.log('--- Client.agents.folders available methods/properties ---');
  console.log(Array.from(methods).sort());
}

exploreSDK();
