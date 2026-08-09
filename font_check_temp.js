const { chromium } = require('playwright');
const targets = [
  ['https://www.thehiddenqueen.de/library', 'h1, .hq-h1, .hq-h2'],
  ['https://www.thehiddenqueen.de/library/wenn-der-alltag-lauter-wird', 'h1'],
  ['https://www.thehiddenqueen.de/raumkonzepte', 'h1'],
  ['https://www.thehiddenqueen.de/manufaktur', 'h1'],
  ['https://www.thehiddenqueen.de/shop', 'h1'],
  ['https://www.thehiddenqueen.de/kollektionen', 'h1'],
];
(async () => {
  const browser = await chromium.launch();
  for (const [url, sel] of targets) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const el = page.locator(sel).first();
    const font = await el.evaluate(e => getComputedStyle(e).fontFamily).catch(() => 'ERR');
    console.log(url, '=>', font);
    await page.close();
  }
  await browser.close();
})();
