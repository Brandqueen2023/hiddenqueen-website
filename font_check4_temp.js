const { chromium } = require('playwright');
const targets = ['https://www.thehiddenqueen.de/manufaktur', 'https://www.thehiddenqueen.de/shop'];
(async () => {
  const browser = await chromium.launch();
  for (const url of targets) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const detected = await page.evaluate(() => {
      function detect(family) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const text = 'mmmmmmmmmmlli';
        ctx.font = '72px monospace';
        const baseWidth = ctx.measureText(text).width;
        ctx.font = '72px "' + family + '", monospace';
        return baseWidth !== ctx.measureText(text).width;
      }
      return { fraunces: detect('Fraunces'), shippori: detect('Shippori Mincho') };
    });
    console.log(url, JSON.stringify(detected));
    await page.close();
  }
  await browser.close();
})();
