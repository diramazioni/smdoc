// Shared types and configurations that can be used on both client and server
export const ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
  ]);
  
  export const ALLOWED_DOC_TYPES = new Set([
    'text/markdown',
    'application/pdf'
  ]);
  
  // File size limits in bytes (100MB)
  export const MAX_FILE_SIZE = 100 * 1024 * 1024;
  
  // MIME type mapping
  export const mimeTypes = {
    'text/markdown': '.md',
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp'
  } as const;
  
  // Reverse lookup for file extensions
  export const extensionToMime: Record<string, string> = Object.entries(mimeTypes)
    .reduce((acc, [mime, ext]) => ({...acc, [ext]: mime}), {});
  
  export function isAllowedFileType(mimeType: string): boolean {
    return ALLOWED_IMAGE_TYPES.has(mimeType) || ALLOWED_DOC_TYPES.has(mimeType);
  }
  
  export function getMimeTypeFromFilename(filename: string): string | undefined {
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    return extensionToMime[ext];
  }
  
  export type FileType = 'md' | 'pdf' | 'img';