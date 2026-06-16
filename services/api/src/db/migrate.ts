import '../env';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

async function migrate() {
  const connectionString =
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/household_inventory';

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const migrationsDir = path.resolve(__dirname, '../../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      console.log(`Applied migration: ${file}`);
    }
    console.log('All migrations completed successfully.');
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
