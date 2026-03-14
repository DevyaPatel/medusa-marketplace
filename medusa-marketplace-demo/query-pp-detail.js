const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://marketplace:super-secure-password@localhost/marketplace',
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM payment_provider');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
