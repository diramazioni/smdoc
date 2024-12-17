import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';

import { 
    type FileType,
    getMimeTypeFromFilename,
  } from '$lib/config/files.types';
  import { 
    DOCS_DIR, 
    ASSETS_DIR,
    getFileDirectory,
  } from '$lib/config/files.server';
  


export const GET: RequestHandler = async ({ params, request }) => {
  const fileName = params.file;
  if (!fileName) {
    return error(404, 'File not found');
  }

  const mimeType = getMimeTypeFromFilename(fileName);
  if (!mimeType) {
    return error(400, 'Invalid file type');
  }

  const directory = getFileDirectory(mimeType);
  const filePath = path.join(directory, fileName);

  if (!fs.existsSync(filePath)) {
    return error(404, 'File not found');
  }

  const stats = fs.statSync(filePath);
  const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;

  // Check if client has current version
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304 });
  }

  const headers = {
    'Content-Type': mimeType,
    'Content-Length': stats.size.toString(),
    'ETag': etag,
    'Cache-Control': 'public, max-age=31536000',
    'Last-Modified': stats.mtime.toUTCString()
  };

  const readStream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(readStream);

  return new Response(webStream, { headers });
};