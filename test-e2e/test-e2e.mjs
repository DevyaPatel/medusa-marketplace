import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000); // 30s timeout

    console.log("Navigating to store page...");
    await page.goto('http://localhost:8000/us/store', { waitUntil: 'networkidle2' });

    console.log("Clicking a product...");
    await page.waitForSelector('a[href^="/us/products/"]');
    const products = await page.$$('a[href^="/us/products/"]');
    if (products.length === 0) throw new Error("No products found on store page!");
    
    // Click and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      products[0].click()
    ]);

    console.log("Wait for product page... Adding to cart...");
    // wait for add to cart button
    await page.waitForSelector('[data-testid="add-product-button"]', { visible: true });
    
    // Evaluate if disabled
    const isDisabled = await page.$eval('[data-testid="add-product-button"]', el => el.disabled);
    if (isDisabled) {
        console.error("ADD TO CART BUTTON IS DISABLED. It might be out of stock or missing a price.");
        throw new Error("Add to cart button disabled");
    }

    await new Promise(r => setTimeout(r, 2000)); // wait for client hydration
    await page.click('[data-testid="add-product-button"]');
    console.log("Clicked add to cart.");

    // The cart side menu might open or update badge. We can just go to checkout.
    await new Promise(r => setTimeout(r, 3000));
    console.log("Going to checkout...");
    await page.goto('http://localhost:8000/us/checkout?step=address', { waitUntil: 'networkidle0' });

    console.log("Filling address form...");
    await page.waitForSelector('[data-testid="shipping-first-name-input"]', { visible: true });
    await page.type('[data-testid="shipping-first-name-input"]', 'John');
    await page.type('[data-testid="shipping-last-name-input"]', 'Doe');
    await page.type('[data-testid="shipping-address-input"]', '123 Main St');
    await page.type('[data-testid="shipping-postal-code-input"]', '10001');
    await page.type('[data-testid="shipping-city-input"]', 'New York');
    // For NativeSelect, try setting value using select
    try { await page.select('[data-testid="shipping-country-select"]', 'us'); } catch(e){}
    await page.type('[data-testid="shipping-province-input"]', 'NY');
    await page.type('[data-testid="shipping-email-input"]', 'test@example.com');
    await page.type('[data-testid="shipping-phone-input"]', '5551234567');

    console.log("Submitting address...");
    await page.click('[data-testid="submit-address-button"]');
    
    console.log("Waiting for delivery options...");
    await page.waitForSelector('[data-testid="delivery-option-radio"]', { visible: true });
    await page.click('[data-testid="delivery-option-radio"]');

    console.log("Submitting delivery...");
    // click submit delivery using evaluate in case it's obscured
    await page.$eval('[data-testid="submit-delivery-option-button"]', el => el.click());

    console.log("Waiting for payment options...");
    await page.waitForSelector('[data-testid="submit-payment-button"]', { visible: true });
    await page.$eval('[data-testid="submit-payment-button"]', el => el.click());

    console.log("Placing order...");
    await page.waitForSelector('[data-testid="submit-order-button"]', { visible: true });
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.$eval('[data-testid="submit-order-button"]', el => el.click())
    ]);

    const url = page.url();
    console.log("URL after order placement:", url);

    const orderIdMatch = url.match(/\/order\/(order_[A-Z0-9]+)\/confirmed/i);
    if (orderIdMatch) {
      console.log("🎉 Successfully placed order! Order ID:", orderIdMatch[1]);
    } else {
      console.log("Could not parse Order ID from URL:", url);
    }
    
  } catch (e) {
    console.error("Error during checkout:", e.message);
  } finally {
    await browser.close();
  }
})();
