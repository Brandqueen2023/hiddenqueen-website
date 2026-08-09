const { chromium } = require('playwright');
const targets = [
  'https://www.thehiddenqueen.de/library',
  'https://www.thehiddenqueen.de/library/wenn-der-alltag-lauter-wird',
  'https://www.thehiddenqueen.de/raumkonzepte',
  'https://www.thehiddenqueen.de/kollektionen',
];
(async () => {
  const browser = await chromium.launch();
  for (const url of targets) {
    const page = await browser.newPage();
    const fontRequests = [];
    page.on('request', (req) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) fontRequests.push(req.url());
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        fraunces500: document.fonts.check('500 20px Fraunces'),
        shippori: document.fonts.check('16px "Shippori Mincho"'),
        entries: Array.from(document.fonts).map(f => f.family + ' ' + f.weight + ' ' + f.status)
      };
    });
    console.log('===', url, '===');
    console.log('font requests:', fontRequests.length, fontRequests.slice(0,3));
    console.log('fraunces500 check:', loaded.fraunces500, ' shippori check:', loaded.shippori);
    console.log('loaded font entries:', loaded.entries);
    await page.close();
  }
  await browser.close();
})();
