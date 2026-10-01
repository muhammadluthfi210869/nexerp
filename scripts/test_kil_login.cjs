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

async function testLogin() {
  try {
    const getRes = await fetch('https://kil.gserp.id/auth/login');
    const setCookie = getRes.headers.get('set-cookie');
    const html = await getRes.text();
    const csrfMatch = html.match(/name="csrf_gs"\s+value="([^"]+)"/);
    const csrf = csrfMatch ? csrfMatch[1] : '';
    console.log('Got CSRF:', csrf);
    console.log('Initial Cookie:', setCookie);

    const params = new URLSearchParams();
    params.append('csrf_gs', csrf);
    params.append('email', email);
    params.append('password', password);
    params.append('remember', '1');

    // In CodeIgniter, both ci_session and csrf_cookie_gs are required!
    const cookies = getRes.headers.getSetCookie ? getRes.headers.getSetCookie() : [setCookie];
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
    console.log('Sending cookies:', cookieHeader);

    const postRes = await fetch('https://kil.gserp.id/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'Referer': 'https://kil.gserp.id/auth/login',
        'Origin': 'https://kil.gserp.id',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: params.toString(),
      redirect: 'manual'
    });

    console.log('Post Status:', postRes.status);
    console.log('Location:', postRes.headers.get('location'));
    const postCookies = postRes.headers.getSetCookie ? postRes.headers.getSetCookie() : [postRes.headers.get('set-cookie')];
    console.log('Post Cookies:', postCookies);

    // Follow redirect to see flash message
    const redirectUrl = postRes.headers.get('location') || 'https://kil.gserp.id/auth/login';
    const allCookies = [
      ...cookieHeader.split('; '),
      ...(postCookies.filter(Boolean).map(c => c.split(';')[0]))
    ];
    const combinedCookie = Array.from(new Set(allCookies)).join('; ');

    const followRes = await fetch(redirectUrl, {
      headers: {
        'Cookie': combinedCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log('Follow Status:', followRes.status, 'Url:', followRes.url);
    const followHtml = await followRes.text();
    // Check if there is an alert or flash message or dashboard
    const alertMatch = followHtml.match(/<div[^>]*class="[^"]*alert[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (alertMatch) console.log('Flash/Alert Message:', alertMatch[0].replace(/<[^>]+>/g, ' ').trim());
    const titleMatch = followHtml.match(/<title>([^<]+)<\/title>/);
    console.log('Title after redirect:', titleMatch ? titleMatch[1].trim() : 'N/A');
    if (followHtml.includes('logout') || followHtml.includes('dashboard') || followHtml.includes('Selamat Datang')) {
      console.log('SUCCESSFULLY AUTHENTICATED!');
    }

  } catch (err) {
    console.error('Error during testLogin:', err);
  }
}

testLogin();
