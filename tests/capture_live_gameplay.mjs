import puppeteer from 'puppeteer';
import path from 'path';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 });

  // 1. Age Gate: click button with class 'age-btn-confirm' or similar, or #btn-confirm-age
  try {
    const confirmBtn = await page.waitForSelector('#btn-confirm-age, .age-btn-confirm, button:has-text("XÁC NHẬN")', { timeout: 3000 });
    if (confirmBtn) {
      console.log('Clicking Age Gate confirm button...');
      await confirmBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (e) {
    console.log('Age gate not shown or already dismissed:', e.message);
  }

  // 2. Auth: click Guest / "Dạo chơi ẩn danh"
  try {
    const guestBtn = await page.waitForSelector('#btn-guest, .guest-login-btn, button:has-text("Dạo chơi")', { timeout: 3000 });
    if (guestBtn) {
      console.log('Clicking Guest login button...');
      await guestBtn.click();
      await new Promise(r => setTimeout(r, 1200));
    }
  } catch (e) {
    console.log('Guest button not found or skipped:', e.message);
  }

  // 3. Character Selection: click confirm character
  try {
    const charConfirmBtn = await page.waitForSelector('#btn-confirm-char, .btn-confirm-character, button:has-text("BẮT ĐẦU"), button:has-text("BƯỚC VÀO")', { timeout: 3000 });
    if (charConfirmBtn) {
      console.log('Clicking Character confirm button...');
      await charConfirmBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    }
  } catch (e) {
    console.log('Char confirm button not found or skipped:', e.message);
  }

  // Let 3D world render for 3 seconds
  await new Promise(r => setTimeout(r, 3000));

  const screenshotPath = path.resolve('C:/Users/TruongAn_PC/.gemini/antigravity/brain/887e3043-f97e-4bca-ae48-23316c9c09d3/shot_gameplay_walk.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
}

run().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
