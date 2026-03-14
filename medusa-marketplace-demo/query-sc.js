const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgres://marketplace:super-secure-password@localhost/marketplace',
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, name FROM sales_channel limit 5');
  fs.writeFileSync('sc.json', JSON.stringify(res.rows, null, 2));
  console.log("Written to sc.json");
  await client.end();
}

run().catch(console.error);
