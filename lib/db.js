/* Gemeinsamer Postgres-Zugriff fuer alle Serverless-Functions.
   DATABASE_URL kommt aus der Neon-Integration (Vercel Marketplace). */
const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL ist nicht gesetzt.');
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=') ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

async function query(text, params) {
  const client = getPool();
  return client.query(text, params);
}

module.exports = { query, getPool };
