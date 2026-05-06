import { test, expect } from '@playwright/test';

// Daftar URL modul yang akan diaudit (Fase 1: X-Ray)
const MODULES = [
  '/dashboard',
  '/finance',
  '/hr',
  '/scm',
  '/warehouse',
  '/production',
  '/rnd',
  '/marketing',
  '/bussdev',
  '/executive',
  '/legality',
  '/logistics',
  '/master',
  '/qc',
  '/creative'
];

test.describe('Phase 1: Full ERP Loading Audit (X-Ray)', () => {
  test.setTimeout(120000); 

  test('Audit all modules for stuck loading screens', async ({ page }) => {
    const results: { url: string; status: 'OK' | 'STUCK' | 'ERROR'; timeMs?: number; errorMsg?: string }[] = [];

    console.log('Logging in...');
    
    try {
      await page.goto('http://localhost:3001/login', { timeout: 30000 });
      await page.waitForSelector('#email', { timeout: 15000 });
      await page.fill('#email', 'admin@dreamlab.com'); 
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/.*\/(dashboard|warehouse|finance|hub|terminal)/, { timeout: 15000 });
      console.log('Login successful. Starting audit...');
    } catch (e: any) {
      console.log('Login failed! Capturing screenshot...', e.message);
      await page.screenshot({ path: 'tests/evidence/login-failure.png' });
      throw e;
    }

    for (const mod of MODULES) {
      const url = `http://localhost:3001${mod}`;
      console.log(`\nAuditing: ${url}`);
      const startTime = Date.now();

      try {
        // Pindah halaman
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Cek apakah elemen loading muncul dan cek apakah ia HILANG dalam 5 detik
        // Loading component memiliki teks "Synchronizing"
        const loadingIndicator = page.locator('text=Synchronizing');
        
        // Kita tunggu indikator loading hilang. Jika tidak hilang dalam 5 detik, berarti STUCK.
        try {
           await expect(loadingIndicator).toBeHidden({ timeout: 5000 });
           const loadTime = Date.now() - startTime;
           console.log(`✅ [OK] ${mod} loaded successfully in ${loadTime}ms`);
           results.push({ url: mod, status: 'OK', timeMs: loadTime });
        } catch (e) {
           const loadTime = Date.now() - startTime;
           console.log(`❌ [STUCK] ${mod} is stuck on loading screen!`);
           results.push({ url: mod, status: 'STUCK', timeMs: loadTime, errorMsg: 'Loading overlay did not disappear within 5 seconds.' });
           
           // Ambil screenshot sebagai bukti
           await page.screenshot({ path: `tests/evidence/stuck-${mod.replace('/', '')}.png` });
        }

      } catch (err: any) {
        console.log(`⚠️ [ERROR] Failed to load ${mod}: ${err.message}`);
        results.push({ url: mod, status: 'ERROR', errorMsg: err.message });
      }
    }

    // 3. CETAK HASIL AUDIT
    console.log('\n==================================================');
    console.log('📊 AUDIT REPORT: PHASE 1 (STUCK LOADING DETECTION)');
    console.log('==================================================');
    
    let stuckCount = 0;
    results.forEach(res => {
      const statusIcon = res.status === 'OK' ? '✅' : res.status === 'STUCK' ? '❌' : '⚠️';
      console.log(`${statusIcon} ${res.url.padEnd(15)} | Status: ${res.status} ${res.timeMs ? '| Time: ' + res.timeMs + 'ms' : ''}`);
      if (res.status === 'STUCK') stuckCount++;
    });

    console.log('==================================================');
    console.log(`Total Pages: ${MODULES.length} | Stuck Pages: ${stuckCount}`);

    // Simpan hasil ke file (opsional, untuk dianalisa di Fase 2)
    // Bisa dilakukan dengan assertion yang sengaja digagalkan jika ada error agar masuk ke log CI/CD
    expect(stuckCount, `Ditemukan ${stuckCount} halaman yang stuck loading! Silakan cek folder tests/evidence/`).toBe(0);
  });
});
