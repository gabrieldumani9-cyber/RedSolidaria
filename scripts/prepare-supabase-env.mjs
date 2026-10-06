import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const envFile = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const fileValues = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.replace(/^['"]|['"]$/g, '')]),
);

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? fileValues.SUPABASE_URL ?? fileValues.VITE_SUPABASE_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? fileValues.SUPABASE_ANON_KEY ?? fileValues.VITE_SUPABASE_ANON_KEY ?? '';

if (!url || !anonKey) {
  throw new Error('Supabase credentials are not available for this build.');
}

const output = `export const supabaseConfig = ${JSON.stringify({ url, anonKey }, null, 2)} as const;\n`;
writeFileSync('src/environments/environment.ts', output);
