const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://marketplace:super-secure-password@localhost/marketplace',
});

async function run() {
  await client.connect();
  const res1 = await client.query('SELECT * FROM payment_provider');
  console.log("PAYMENT PROVIDERS:", res1.rows);
  
  // region providers link
  const res2 = await client.query(`
    SELECT r.id, r.name, prp.payment_provider_id
    FROM region r
    LEFT JOIN region_payment_provider prp ON r.id = prp.region_id
  `);
  console.log("REGION PAYMENT PROVIDERS:", res2.rows);

  await client.end();
}
run().catch(console.error);
