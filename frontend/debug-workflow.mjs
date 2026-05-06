import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3001/login');
  await page.getByPlaceholder('name@company.com').fill('bd@portoaureon.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button:has-text("Sign In")').click();
  await page.waitForURL('**/dashboard**');

  await page.click('text=Commercial');
  console.log('Clicked Commercial');
  
  await page.click('text=Quick Add Vector');
  console.log('Clicked Quick Add Action');
  await page.waitForSelector('text=New Client Vector synchronized.');
  console.log('Toast appeared');

  // get all p texts
  const paragraphs = await page.locator('p').allTextContents();
  console.log('Paragraphs:', paragraphs);
  
  await browser.close();
})();
