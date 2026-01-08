import fs from 'node:fs';
import path from 'node:path';

/**
 * Updates or adds a variable in the .env file.
 */
export function updateEnvVariable(key: string, value: string) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const lines = envContent.split('\n');
  const index = lines.findIndex(line => line.startsWith(`${key}=`));

  if (index !== -1) {
    lines[index] = `${key}=${value}`;
  } else {
    // Add newline if file doesn't end with one
    if (envContent.length > 0 && !envContent.endsWith('\n')) {
      lines.push('');
    }
    lines.push(`${key}=${value}`);
  }

  fs.writeFileSync(envPath, lines.join('\n'));
}

/**
 * Gets a variable from the .env file.
 * This is useful for getting values before they are loaded by SvelteKit.
 */
export function getEnvVariable(key: string): string | null {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return null;

  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}
