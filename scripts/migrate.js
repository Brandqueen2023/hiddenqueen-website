/* Einmalig lokal ausfuehren: node scripts/migrate.js
   Erwartet DATABASE_URL in der Umgebung (z.B. via `vercel env pull`). */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL ist nicht gesetzt. Vorher z.B. `vercel env pull .env.local` ausfuehren und laden.');
    process.exit(1);
  }
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=') ? undefined : { rejectUnauthorized: false },
  });
  try {
    await pool.query(sql);
    console.log('Schema angelegt/aktualisiert.');
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
