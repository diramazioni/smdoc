import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface UploadState {
  status: 'idle' | 'uploading' | 'completed' | 'error';
  progress: number;
}

interface UploadOptions {
  file: File;
  url: string;
  headers?: Record<string, string>;
}

export function createUploadStore() {
  const { subscribe, update }: Writable<UploadState> = writable({ 
    status: 'idle', 
    progress: 0 
  });
  
  let xhr: XMLHttpRequest;

  return {
    subscribe,
    
    upload({ file, url, headers = {} }: UploadOptions): Promise<XMLHttpRequest> {
      return new Promise((resolve, reject) => {
        xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            update(state => ({ ...state, status: 'uploading', progress }));
          }
        });

        xhr.addEventListener('loadend', () => {
          const status = xhr.status >= 200 && xhr.status < 400 ? 'completed' : 'error';
          update(state => ({ ...state, status }));
          resolve(xhr);
        });

        xhr.upload.addEventListener('error', () => {
          update(state => ({ ...state, progress: 0, status: 'error' }));
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', url);
        
        // Set default headers
        xhr.setRequestHeader('Accept', 'application/json');
        
        // Set custom headers
        Object.entries(headers).forEach(([name, value]) => {
          xhr.setRequestHeader(name, value);
        });

        xhr.send(file);
      });
    },

    reset() {
      update(() => ({ status: 'idle', progress: 0 }));
    }
  };
}
