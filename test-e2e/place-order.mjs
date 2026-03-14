const baseUrl = 'http://localhost:9000/store';
const headers = {
  'Content-Type': 'application/json',
  'x-publishable-api-key': 'pk_83e9dc78077449f17582b7bd427c1819c1446cca1452897c09c1f161b872f1b1'
};

async function req(path, opts = {}) {
  const url = path.startsWith('http') ? path : baseUrl + path;
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function run() {
  try {
    console.log("0. Fetching products to find a variant with a price...");
    const productsRes = await req('/products?region_id=reg_01KKKEWKBJ19TT615BVKZN5R90&fields=*variants,*variants.calculated_price', { method: 'GET' });
    let validVariantId = null;
    for (const p of productsRes.products) {
      const v = p.variants?.find(v => v.calculated_price !== null && v.calculated_price !== undefined);
      if (v) {
        validVariantId = v.id;
        break;
      }
    }
    if (!validVariantId) {
      throw new Error("No products with valid prices found for the region!");
    }
    console.log("Found valid variant:", validVariantId);

    console.log("1. Creating cart...");
    const { cart } = await req('/carts', {
      method: 'POST',
      body: JSON.stringify({
        region_id: 'reg_01KKKEWKBJ19TT615BVKZN5R90',
        sales_channel_id: 'sc_01KKK23DZSH0MXVM1414JAS7V0',
        email: 'test@example.com',
        shipping_address: {
          first_name: 'John', last_name: 'Doe',
          address_1: '123 Main St', city: 'New York',
          country_code: 'us', postal_code: '10001', phone: '5551234567'
        }
      })
    });
    console.log("Cart created:", cart.id);

    console.log("2. Adding line item...");
    await req(`/carts/${cart.id}/line-items`, {
      method: 'POST',
      body: JSON.stringify({
        variant_id: validVariantId,
        quantity: 1
      })
    });
    console.log("Item added");

    console.log("3. Fetching shipping options...");
    const { shipping_options } = await req(`/shipping-options?cart_id=${cart.id}`);
    
    if (shipping_options && shipping_options.length > 0) {
      console.log("4. Adding shipping method:", shipping_options[0].id);
      await req(`/carts/${cart.id}/shipping-methods`, {
         method: 'POST',
         body: JSON.stringify({ option_id: shipping_options[0].id })
      });
    }

    console.log("5. Initiating payment session...");
    const { cart: updatedCart } = await req(`/carts/${cart.id}`);
    if (updatedCart.payment_collection) {
       await req(`/payment-collections/${updatedCart.payment_collection.id}/payment-sessions`, {
         method: 'POST',
         body: JSON.stringify({ provider_id: 'pp_system_default' })
       });
    }

    console.log("6. Completing cart...");
    const completeRes = await req(`/carts/${cart.id}/complete`, { method: 'POST' });
    
    if (completeRes.type === 'order') {
      console.log("🎉 Successfully placed order! Order ID:", completeRes.order.id);
    } else {
      console.log("Complete did not return order:", JSON.stringify(completeRes, null, 2));
    }
  } catch (err) {
    console.error("Error creating order:", err.message);
  }
}

run();
