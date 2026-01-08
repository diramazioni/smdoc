import { json } from '@sveltejs/kit';
import { getFileList } from '$lib/api';
import type { FileType } from '$lib/config/files.types';

export async function GET({ url }) {
  const type = url.searchParams.get('type') as FileType;
  const path = url.searchParams.get('path') || '';

  if (!type || !['md', 'pdf', 'img'].includes(type)) {
    return json({ error: 'Invalid type' }, { status: 400 });
  }

  try {
    const assets = await getFileList(type, path);
    return json(assets);
  } catch (err: any) {
    return json({ error: err.message }, { status: 500 });
  }
}
