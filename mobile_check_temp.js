const { chromium } = require('playwright');

const pages = ['raumkonzepte', 'manufaktur', 'shop'];

(async () => {
  const browser = await chromium.launch();
  for (const p of pages) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`https://www.thehiddenqueen.de/${p}`, { waitUntil: 'networkidle' });

    // check horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(p, 'horizontal overflow:', overflow, 'scrollWidth vs innerWidth:', await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]));

    await page.screenshot({ path: `C:/tmp/mobile-${p}-hero.png` });

    // open burger menu
    const burger = page.locator('.hq-burger');
    if (await burger.count()) {
      await burger.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `C:/tmp/mobile-${p}-nav.png` });
      await burger.click().catch(() => {});
    }

    // scroll to form and screenshot
    const form = page.locator('form').first();
    if (await form.count()) {
      await form.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `C:/tmp/mobile-${p}-form.png` });
    }

    await page.close();
  }
  await browser.close();
  console.log('DONE');
})();
