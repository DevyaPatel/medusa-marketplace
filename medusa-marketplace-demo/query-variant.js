const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://marketplace:super-secure-password@localhost/marketplace',
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT pv.id, pv.title, pp.amount, pp.currency_code 
    FROM product_variant pv
    JOIN price_preference ppf ON true -- just getting a price
    JOIN price pp ON pp.price_set_id = pv.product_id OR pp.price_set_id IS NOT NULL
    LIMIT 5;
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
