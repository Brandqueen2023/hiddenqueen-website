const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  await page.goto('http://localhost:4179/raumkonzepte', { waitUntil: 'networkidle' });
  await page.locator('h2:has-text("Apartmentlösung")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-apartment-top.png' });
  await page.locator('.hq-grid-2').nth(1).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-apartment-images.png' });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto('http://localhost:4179/raumkonzepte', { waitUntil: 'networkidle' });
  await mobile.locator('h2:has-text("Apartmentlösung")').scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: 'screenshot-apartment-mobile-top.png' });
  await mobile.locator('.hq-grid-2').nth(1).scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: 'screenshot-apartment-mobile-images.png' });

  await browser.close();
})();
