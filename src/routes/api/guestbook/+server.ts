import { json } from '@sveltejs/kit';
import { getGuestbookEntries, addGuestbookEntry } from '$lib/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const messages = await getGuestbookEntries();
    return json(messages);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
    const { name, email, content } = await request.json();

    // Basic validation
    if (!name || !email || !content) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await addGuestbookEntry({ name, email, content });

    if (success) {
      return json({ success: true });
    } else {
      return json({ error: 'Failed to save message' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to create message:', error);
    return json({ error: 'Failed to create message' }, { status: 500 });
  }
};