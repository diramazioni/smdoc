import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';
import path from 'node:path';
import {
  MAX_FILE_SIZE,
  isAllowedFileType,
  getMimeTypeFromFilename
} from '$lib/config/files.types';
import {
  DOCS_DIR,
  ASSETS_DIR,
  getFileDirectory
} from '$lib/config/files.server';
import { deleteFileFromLetta } from '$lib/letta/filesystem-service';
import { getLettaProjectId } from '$lib/letta/letta-service';

// Ensure directories exist
[DOCS_DIR, ASSETS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const POST: RequestHandler = async ({ request }) => {
  if (!request.body) {
    return error(400, 'No file provided');
  }

  const fileName = request.headers.get('x-file-name');
  if (!fileName) {
    request.body.cancel();
    return error(400, 'No filename provided');
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
    request.body.cancel();
    return error(400, 'File too large');
  }

  const mimeType = getMimeTypeFromFilename(fileName);
  if (!mimeType || !isAllowedFileType(mimeType)) {
    request.body.cancel();
    return error(400, 'Invalid file type');
  }

  const targetDir = getFileDirectory(mimeType);
  const filePath = path.join(targetDir, fileName);
  const dirName = path.dirname(filePath);

  // Ensure target directory exists (for subdirectories)
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    request.body.cancel();
    return error(400, 'File already exists');
  }

  const writeStream = fs.createWriteStream(filePath);
  const readStream = Readable.fromWeb(request.body as any);

  try {
    await pipeline(readStream, writeStream);
    return json({
      success: true,
      message: 'File uploaded successfully',
      path: filePath
    });
  } catch (err) {
    // Clean up failed upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return error(500, 'Upload failed');
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const fileName = formData.get('file_name');

    if (!fileName || typeof fileName !== 'string') {
      return error(400, 'No filename provided');
    }

    const { deletePath } = await import('$lib/api');

    // Rimuovi da Letta se possibile
    try {
      const projectId = getLettaProjectId();
      await deleteFileFromLetta(projectId, fileName);
    } catch (err) {
      console.warn('Failed to delete file from Letta, proceeding with local deletion:', err);
    }

    const success = await deletePath(fileName);

    if (success) {
      return json({
        success: true,
        message: 'Deleted successfully'
      });
    } else {
      return error(500, 'Failed to delete');
    }
  } catch (err) {
    console.error('Error deleting file:', err);
    return error(500, 'Failed to delete file');
  }
};