const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4177/raumkonzepte', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    return {
      hasGrecaptcha: typeof window.grecaptcha !== 'undefined',
      iframeCount: document.querySelectorAll('iframe[src*="recaptcha"]').length,
      widgetHtml: document.getElementById('hq-r-recaptcha') ? document.getElementById('hq-r-recaptcha').innerHTML.length : -1
    };
  });
  console.log(JSON.stringify(info));
  await browser.close();
})();
