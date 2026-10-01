const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
let email = 'zaki@dreamlab.id';
let password = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  const mEmail = envContent.match(/OLD_ERP_EMAIL=([^\r\n]+)/);
  if (mEmail) email = mEmail[1].trim();
  const mPass = envContent.match(/OLD_ERP_PASSWORD=([^\r\n]+)/);
  if (mPass) password = mPass[1].trim();
} catch (e) {}
if (!password) {
  throw new Error('Isi OLD_ERP_PASSWORD di .env — password tidak lagi ditulis di source.');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('https://kil.gserp.id/auth/login', { waitUntil: 'networkidle' });
  console.log('Login Page Title:', await page.title());



  console.log(`2. Logging in with: ${email}...`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }).catch(e => console.log('Navigation event:', e.message)),
    page.click('#GSForm button[type="submit"], #GSForm input[type="submit"], button:has-text("Masuk")')
  ]);

  console.log('Current URL after submit:', page.url());
  console.log('Page Title after submit:', await page.title());

  // Capture screenshot of landing page
  const screenshotDir = path.join(__dirname, '..', 'artifacts', 'gserp_audit');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  await page.screenshot({ path: path.join(screenshotDir, 'gserp_landing.png'), fullPage: true });
  console.log('Saved screenshot to:', path.join(screenshotDir, 'gserp_landing.png'));

  // Extract navigation items / sidebar links
  const sidebarLinks = await page.evaluate(() => {
    const items = [];
    const elements = document.querySelectorAll('aside a, .sidebar a, nav a, .main-sidebar a, ul.nav-sidebar a');
    elements.forEach(el => {
      const text = el.innerText.trim().replace(/\s+/g, ' ');
      const href = el.getAttribute('href');
      if (text && href && href !== '#' && !href.startsWith('javascript:')) {
        items.push({ text, href });
      }
    });
    return items;
  });

  console.log(`Found ${sidebarLinks.length} sidebar/nav links:`);
  console.log(JSON.stringify(sidebarLinks, null, 2));

  // Save extracted sidebar menu to file
  fs.writeFileSync(path.join(screenshotDir, 'gserp_sidebar_links.json'), JSON.stringify(sidebarLinks, null, 2));

  await browser.close();
}

main().catch(console.error);
