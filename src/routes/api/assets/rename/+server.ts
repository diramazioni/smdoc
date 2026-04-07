import { json } from '@sveltejs/kit';
import { renamePath } from '$lib/api';

export async function POST({ request }) {
  try {
    const { oldPath, newPath } = await request.json();

    if (!oldPath || !newPath) {
      return json({ error: 'Missing paths' }, { status: 400 });
    }

    const success = await renamePath(oldPath, newPath);

    if (success) {
      return json({ success: true });
    } else {
      return json({ error: 'Failed to rename' }, { status: 500 });
    }
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
