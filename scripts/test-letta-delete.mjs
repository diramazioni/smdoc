
import { deleteFileFromLetta } from './src/lib/letta/filesystem-service.ts';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = process.env.LETTA_PROJECT_ID || 'smdr-main';
const TEST_FILE = 'contatti.md'; // Assicurati che esista nel debug output precedente

async function testDelete() {
  try {
    console.log(`Testing deletion of ${TEST_FILE} from project ${PROJECT_ID}...`);
    const result = await deleteFileFromLetta(PROJECT_ID, TEST_FILE);
    console.log('Result:', result);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testDelete();
