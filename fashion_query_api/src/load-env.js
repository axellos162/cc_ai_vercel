import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { access, readFile } from 'fs/promises';
import { constants as fsConstants } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '..', '.env.local');
try {
  await access(envPath, fsConstants.F_OK);
  const envContent = await readFile(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}
