const { chromium } = require('playwright');
const targets = [
  'https://www.thehiddenqueen.de/raumkonzepte',
  'https://www.thehiddenqueen.de/kollektionen',
];
(async () => {
  const browser = await chromium.launch();
  for (const url of targets) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const result = await page.evaluate(async () => {
      await document.fonts.ready;
      const arr = Array.from(document.fonts);
      const shippori = arr.filter(f => f.family.includes('Shippori'));
      const fraunces = arr.filter(f => f.family.includes('Fraunces'));
      return {
        total: arr.length,
        shipporiTotal: shippori.length,
        shipporiLoaded: shippori.filter(f => f.status === 'loaded').length,
        frauncesTotal: fraunces.length,
        frauncesLoaded: fraunces.filter(f => f.status === 'loaded').length,
        // actual rendered check via canvas measure trick
        bodyFontUsed: (() => {
          const el = document.querySelector('.hq-lead, p');
          return el ? getComputedStyle(el).fontFamily : 'none';
        })()
      };
    });
    console.log(url, JSON.stringify(result));
    // canvas-based actual font detection
    const detected = await page.evaluate(() => {
      function detect(family) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const text = 'mmmmmmmmmmlli';
        const size = '72px';
        ctx.font = size + ' monospace';
        const baseWidth = ctx.measureText(text).width;
        ctx.font = size + ' "' + family + '", monospace';
        const testWidth = ctx.measureText(text).width;
        return baseWidth !== testWidth;
      }
      return { fraunces: detect('Fraunces'), shippori: detect('Shippori Mincho') };
    });
    console.log(url, 'canvas-detected actually different from fallback:', JSON.stringify(detected));
    await page.close();
  }
  await browser.close();
})();
