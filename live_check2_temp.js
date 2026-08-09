const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const failed = [];
  page.on('requestfailed', r => failed.push(r.url() + ' :: ' + r.failure()?.errorText));
  page.on('response', r => { if (r.url().includes('fonts') || r.url().includes('careny')) console.log('RESP', r.status(), r.url()); });
  await page.goto('https://www.thehiddenqueen.de/raumkonzepte', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  const info = await page.evaluate(async () => {
    await document.fonts.ready;
    const entries = Array.from(document.fonts).filter(f => f.family.includes('Careny') || f.family.includes('Shippori'));
    function detect(family) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const text = 'mmmmmmmmmmlli';
      ctx.font = '72px monospace';
      const baseWidth = ctx.measureText(text).width;
      ctx.font = '72px "' + family + '", monospace';
      return baseWidth !== ctx.measureText(text).width;
    }
    return {
      entries: entries.map(f => f.family + ' ' + f.weight + ' ' + f.status),
      careny: detect('Careny'),
      h2Font: document.querySelector('h2') ? getComputedStyle(document.querySelector('h2')).fontFamily : null,
    };
  });
  console.log('failed requests:', JSON.stringify(failed));
  console.log('info:', JSON.stringify(info));
  await browser.close();
})();
