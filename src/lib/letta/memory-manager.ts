import { getLettaClient } from './client';
import { getOrCreateSharedMemory } from './letta-service';

/**
 * Updates the shared memory block with project-level information.
 */
export async function updateProjectMemory(
  projectId: string,
  update: {
    structure?: Record<string, any>;
    recentChanges?: Array<{ timestamp: string; action: string; file: string }>;
    statistics?: { totalFiles: number; totalSize?: number };
  }
) {
  const sharedBlock = await getOrCreateSharedMemory(projectId);
  const client = getLettaClient();

  let content = sharedBlock.value || '';

  if (update.structure) {
    // We try to replace the old structure section if it exists, otherwise append
    const structureHeader = '## Project Structure';
    const jsonStart = '```json';
    const jsonEnd = '```';
    const structureContent = `\n\n${structureHeader}\n${jsonStart}\n${JSON.stringify(update.structure, null, 2)}\n${jsonEnd}`;
    
    if (content.includes(structureHeader)) {
      // Very basic replacement logic for the POC
      const parts = content.split(structureHeader);
      const afterStructure = parts[1].split(jsonEnd).slice(1).join(jsonEnd);
      content = parts[0] + structureContent + afterStructure;
    } else {
      content += structureContent;
    }
  }

  if (update.recentChanges) {
    content += `\n\n## Recent Changes (${new Date().toLocaleDateString()})\n`;
    update.recentChanges.forEach(change => {
      content += `- [${change.timestamp}] ${change.action}: ${change.file}\n`;
    });
  }

  if (update.statistics) {
    const statsHeader = '## Statistics';
    const statsContent = `\n\n${statsHeader}\n- Total Files: ${update.statistics.totalFiles}\n${update.statistics.totalSize ? `- Total Size: ${update.statistics.totalSize} bytes\n` : ''}`;
    
    if (content.includes(statsHeader)) {
       // Append to stats for now or replace if we had a more robust parser
       content += `\n- Last update: ${new Date().toISOString()}`;
    } else {
      content += statsContent;
    }
  }

  // Update the block in Letta
  await client.blocks.update(sharedBlock.id, { value: content });

  return sharedBlock;
}

/**
 * Log a specific file change and refresh project statistics.
 */
export async function logChangeAndRefreshStats(
  projectId: string,
  filePath: string,
  action: string,
  docsDir: string
) {
  // Update recent changes
  await logChangeToSharedMemory(projectId, filePath, action);
  
  // Refresh statistics
  try {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
    const totalFiles = files.length;
    let totalSize = 0;
    files.forEach(f => {
      const stats = fs.statSync(path.join(docsDir, f));
      totalSize += stats.size;
    });

    await updateProjectMemory(projectId, {
      statistics: { totalFiles, totalSize }
    });
  } catch (err) {
    console.error('Failed to update project statistics in shared memory:', err);
  }
}

/**
 * Adds an event to the recent changes log in the shared memory.
 */
export async function logChangeToSharedMemory(
  projectId: string,
  filePath: string,
  action: string
) {
  return await updateProjectMemory(projectId, {
    recentChanges: [{
      timestamp: new Date().toISOString(),
      action,
      file: filePath
    }]
  });
}

import fs from 'node:fs';
import path from 'node:path';
