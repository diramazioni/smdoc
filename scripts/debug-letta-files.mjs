
import { Letta } from '@letta-ai/letta-client';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = process.env.LETTA_PROJECT_ID || 'smdr-main';
const FOLDER_NAME = process.env.LETTA_FOLDER_NAME || `project-${PROJECT_ID}`;

async function debugFiles() {
  const client = new Letta({
    apiKey: process.env.LETTA_API_KEY || process.env.VITE_LETTA_API_KEY,
    baseUrl: process.env.LETTA_BASE_URL || 'https://api.letta.com'
  });

  try {
    console.log(`Searching for folder: ${FOLDER_NAME}...`);
    const foldersPage = await client.folders.list();
    const folder = foldersPage.items.find(f => f.name === FOLDER_NAME);

    if (!folder) {
      console.error(`Folder ${FOLDER_NAME} not found.`);
      return;
    }

    console.log(`Found folder: ${folder.name} (${folder.id})`);
    
    console.log('Listing files in folder...');
    // Type cast as any because the SDK might have slightly different structure in reality
    const filesPage = await client.folders.files.list(folder.id);
    
    console.log(`Found ${filesPage.items?.length || 0} files.`);
    
    if (filesPage.items) {
      for (const file of filesPage.items) {
        console.log('--- File ---');
        console.log(`ID: ${file.id}`);
        console.log(`FileName: ${file.file_name}`);
        
        if (file.file_name === 'contatti.md') {
          console.log('Attempting to delete contatti.md...');
          try {
            await client.folders.files.delete(file.id, { folder_id: folder.id });
            console.log('Delete successful!');
          } catch (deleteErr) {
            console.error('Delete failed:', deleteErr);
          }
        }
      }
    }

  } catch (err) {
    console.error('Error debugging files:', err);
  }
}

debugFiles();
