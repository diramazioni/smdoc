import { fail } from '@sveltejs/kit';
import { DOCS_DIR } from '$lib/config/files.server';
import { updateEnvVariable, getEnvVariable } from '$lib/server/env-utils';
import { uploadFileToLetta, updateSharedMemoryWithFile } from '$lib/letta/filesystem-service';
import fs from 'node:fs';
import path from 'node:path';

export const load = async () => {
  return {
    apiKey: getEnvVariable('LETTA_API_KEY') || '',
    baseUrl: getEnvVariable('LETTA_BASE_URL') || 'https://api.letta.com',
    projectId: getEnvVariable('LETTA_PROJECT_ID') || 'smdr-main',
    openaiKey: getEnvVariable('OPENAI_API_KEY') || ''
  };
};

export const actions = {
  saveConfig: async ({ request }) => {
    const data = await request.formData();
    const apiKey = data.get('apiKey') as string;
    const baseUrl = data.get('baseUrl') as string;
    const projectId = data.get('projectId') as string;
    const openaiKey = data.get('openaiKey') as string;

    try {
      if (apiKey) updateEnvVariable('LETTA_API_KEY', apiKey);
      if (baseUrl) updateEnvVariable('LETTA_BASE_URL', baseUrl);
      if (projectId) updateEnvVariable('LETTA_PROJECT_ID', projectId);
      if (openaiKey) updateEnvVariable('OPENAI_API_KEY', openaiKey);
      
      return { success: true, message: 'Configurazione salvata correttamente. Riavviare il server se necessario.' };
    } catch (err: any) {
      return fail(500, { error: err.message });
    }
  },

  syncMemory: async () => {
    try {
      const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
      const results = [];

      for (const file of files) {
        const filePath = path.join(DOCS_DIR, file);
        const slug = file.replace('.md', '');

        try {
          await uploadFileToLetta('smdr-main', filePath, 'markdown');
          await updateSharedMemoryWithFile(
            'smdr-main',
            filePath,
            'updated',
            { title: slug, slug: slug }
          );
          results.push({ file, status: 'success' });
        } catch (err: any) {
          results.push({ file, status: 'error', message: err.message });
        }
      }

      // Aggiorna statistiche progetto a fine sincronizzazione
      try {
        const { logChangeAndRefreshStats } = await import('$lib/letta/memory-manager');
        await logChangeAndRefreshStats('smdr-main', 'ALL_FILES', 'RE-SYNC', DOCS_DIR);
      } catch (err) {
        console.error('Failed to update project memory after sync:', err);
      }

      return { 
        success: true, 
        message: `Sincronizzazione completata: ${results.filter(r => r.status === 'success').length} file sincronizzati.`,
        results 
      };
    } catch (err: any) {
      return fail(500, { error: err.message });
    }
  }
};
