const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4182/raumkonzepte', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const info = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      h2Font: getComputedStyle(document.querySelector('h2')).fontFamily,
      h1Font: getComputedStyle(document.querySelector('.hq-h1')).fontFamily,
      entries: Array.from(document.fonts).filter(f=>f.family.includes('Careny')).map(f=>f.family+' '+f.status),
    };
  });
  console.log(JSON.stringify(info));
  await browser.close();
})();
