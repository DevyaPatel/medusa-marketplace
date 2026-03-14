import fs from 'fs';

const f = async () => {
    try {
        const cartRes = await fetch('http://localhost:9000/store/carts', {
            method: 'POST',
            body: JSON.stringify({region_id:'reg_01KKKEWKBJ19TT615BVKZN5R90', sales_channel_id: 'sc_01KKK23DZSH0MXVM1414JAS7V0'}),
            headers:{'Content-Type':'application/json', 'x-publishable-api-key':'pk_83e9dc78077449f17582b7bd427c1819c1446cca1452897c09c1f161b872f1b1'}
        });
        const cartJSON = await cartRes.text();
        fs.writeFileSync('cart-err.json', cartJSON);
        console.log("Cart Status:", cartRes.status);
        const cart = JSON.parse(cartJSON).cart;
        
        if (cart) {
            const liRes = await fetch('http://localhost:9000/store/carts/'+cart.id+'/line-items', {
                method: 'POST',
                body: JSON.stringify({ variant_id: 'variant_01KKKEXRBNTW52V493RBNJ1JJD', quantity: 1 }),
                headers:{'Content-Type':'application/json', 'x-publishable-api-key':'pk_83e9dc78077449f17582b7bd427c1819c1446cca1452897c09c1f161b872f1b1'}
            });
            console.log("Line Item Status:", liRes.status);
        }
    } catch (e) {
        console.error(e);
    }
};
f();
