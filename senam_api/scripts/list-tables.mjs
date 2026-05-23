import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:203050@127.0.0.1:5432/senam',
});

await client.connect();
const result = await client.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
);
console.log(result.rows.map((row) => row.tablename).join('\n') || '(no tables)');
await client.end();
