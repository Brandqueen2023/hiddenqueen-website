const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('https://www.thehiddenqueen.de/raumkonzepte', { waitUntil: 'networkidle', timeout: 60000 });
  const fontCheck = await page.evaluate(async () => {
    await document.fonts.ready;
    function detect(family) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const text = 'mmmmmmmmmmlli';
      ctx.font = '72px monospace';
      const baseWidth = ctx.measureText(text).width;
      ctx.font = '72px "' + family + '", monospace';
      return baseWidth !== ctx.measureText(text).width;
    }
    return { careny: detect('Careny'), shippori: detect('Shippori Mincho'), fraunces: detect('Fraunces') };
  });
  console.log('LIVE font check:', JSON.stringify(fontCheck));
  await page.locator('h2:has-text("Apartmentlösung")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'C:/tmp/live-apartment-check.png' });
  const grid = page.locator('.hq-grid-2').nth(1);
  await grid.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'C:/tmp/live-apartment-grid.png' });
  await browser.close();
})();
