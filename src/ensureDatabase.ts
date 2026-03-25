import { Client } from 'pg';

export const ensureDatabase = async (db: { host: string; port: number; username?: string; password?: string; database?: string }) => {
  const client = new Client({
    host: db.host,
    port: db.port,
    user: db.username,
    password: db.password,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [db.database]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${db.database}"`);
    }
  } finally {
    await client.end();
  }
};
