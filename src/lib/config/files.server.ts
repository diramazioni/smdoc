import { env } from '$env/dynamic/private';
import path from 'node:path';
import type { FileType } from './files.types';

// Server-side directory configuration
export const DOCS_DIR = path.resolve(process.cwd(), env.DOCS_DIR ?? 'mdocs');
export const ASSETS_DIR = path.resolve(process.cwd(), env.ASSETS_DIR ?? 'assets');

export function getFileDirectory(mimeType: string): string {
  return mimeType === 'text/markdown' ? DOCS_DIR : ASSETS_DIR;
}

export function getDirectoryForType(type: FileType): string {
  return type === 'md' ? DOCS_DIR : ASSETS_DIR;
}