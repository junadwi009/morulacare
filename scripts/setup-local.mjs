import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Resolve from this script, so invoking it from another directory is safe.
const root = new URL('../', import.meta.url);
const env = new URL('.env', root);
if (!existsSync(env)) {
  writeFileSync(env, `POSTGRES_DB=morula_demo\nPOSTGRES_USER=morula_demo\nPOSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\n`, { flag: 'wx' });
  console.log('Created ignored .env with a random local development password.');
} else console.log('Preserved existing .env.');
const mobile = new URL('mobile/.env.local', root);
if (!existsSync(mobile)) {
  writeFileSync(mobile, 'EXPO_PUBLIC_API_URL=http://localhost:8080\nEXPO_PUBLIC_DEMO_AUTH=true\n', { flag: 'wx' });
  console.log('Created mobile/.env.local for local API demo.');
} else console.log('Preserved existing mobile/.env.local.');
console.log(`Workspace: ${fileURLToPath(root)}`);
