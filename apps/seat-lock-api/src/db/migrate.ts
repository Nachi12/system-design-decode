import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.log('[Migration] Starting PostgreSQL schema migration...');
    const migrationPath = path.join(__dirname, 'migrations', '001_init_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('[Migration] Schema migration completed successfully.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Migration Error]: Failed to execute migration:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// If run directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}
