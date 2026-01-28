import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL (use the direct Neon connection string)');
  process.exit(1);
}

const migrationsDir = new URL('../migrations/', import.meta.url).pathname;

async function main() {
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.log('No migration files found.');
    return;
  }

  const sql = neon(databaseUrl);

  for (const file of files) {
    const fullPath = join(migrationsDir, file);
    const contents = await readFile(fullPath, 'utf8');
    if (!contents.trim()) continue;
    console.log(`Applying ${file}...`);
    await sql.unsafe(contents);
  }

  console.log('Migrations complete.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
