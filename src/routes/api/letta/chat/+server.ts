import { json } from '@sveltejs/kit';
import { getOrCreateUserAgent, attachSharedMemory } from '$lib/letta/letta-service';
import { getLettaClient } from '$lib/letta/client';
import type { LettaChatRequest } from '$lib/letta/types';

export async function POST({ request }) {
  try {
    const { message, projectId, userId }: LettaChatRequest = await request.json();

    if (!userId) {
      return json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Recupera o crea agente
    const agent = await getOrCreateUserAgent(userId);

    // Collega alla memoria condivisa del progetto
    if (projectId) {
      await attachSharedMemory(agent.id, projectId);
    }

    // Invia messaggio all'agente
    const response = await getLettaClient().agents.messages.create(
      agent.id,
      {
        messages: [{ role: 'user', content: message }]
      }
    );

    // Estrai risposta
    let assistantMessage = '';
    if (response.messages) {
      for (const msg of response.messages) {
        if (msg.message_type === 'assistant_message') {
          assistantMessage += msg.content;
        }
      }
    }

    return json({
      success: true,
      message: assistantMessage,
      agentId: agent.id
    });

  } catch (error: any) {
    console.error('Letta chat error:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
