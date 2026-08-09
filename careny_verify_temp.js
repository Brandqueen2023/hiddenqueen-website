const { chromium } = require('playwright');
const targets = ['raumkonzepte', 'manufaktur', 'shop', 'kollektionen', 'library'];
(async () => {
  const browser = await chromium.launch();
  for (const p of targets) {
    const page = await browser.newPage();
    await page.goto(`http://localhost:4181/${p}`, { waitUntil: 'networkidle' });
    const detected = await page.evaluate(async () => {
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
      return { careny: detect('Careny'), shippori: detect('Shippori Mincho') };
    });
    console.log(p, JSON.stringify(detected));
    await page.close();
  }
  await browser.close();
})();
