import pg from 'pg';

const { Client } = pg;
const client = new Client({
  host: '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: 'postgres',
});

const dbName = process.env.POSTGRES_DB ?? 'senam';

await client.connect();
const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
if (!exists.rowCount) {
  await client.query(`CREATE DATABASE "${dbName}"`);
  console.log(`Created database "${dbName}"`);
} else {
  console.log(`Database "${dbName}" already exists`);
}
await client.end();
