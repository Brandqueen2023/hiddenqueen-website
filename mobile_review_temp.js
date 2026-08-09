const { chromium } = require('playwright');

const pages = ['raumkonzepte', 'manufaktur', 'shop'];

(async () => {
  const browser = await chromium.launch();
  for (const p of pages) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:4178/${p}`, { waitUntil: 'networkidle' });

    // tap target sizes for nav burger, primary buttons, form inputs
    const sizes = await page.evaluate(() => {
      function rect(sel) {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }
      return {
        burger: rect('.hq-burger'),
        primaryBtn: rect('.hq-btn--primary'),
        firstInput: rect('.hq-input'),
        firstSelect: rect('.hq-select'),
        recaptcha: rect('.g-recaptcha'),
        heroH1: rect('.hq-h1'),
      };
    });
    console.log('===', p, 'tap target sizes ===', JSON.stringify(sizes));

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    console.log(p, 'overflow check:', JSON.stringify(overflow));

    await page.screenshot({ path: `C:/tmp/review-${p}-hero.png` });

    const burger = page.locator('.hq-burger');
    await burger.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `C:/tmp/review-${p}-nav.png` });
    await page.locator('.hq-close').click().catch(() => {});
    await page.waitForTimeout(300);

    const form = page.locator('form').first();
    if (await form.count()) {
      await form.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `C:/tmp/review-${p}-form.png` });
    }

    await page.close();
  }
  await browser.close();
  console.log('DONE');
})();
