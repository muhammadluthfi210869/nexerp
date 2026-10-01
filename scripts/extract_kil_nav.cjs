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

async function extractNav() {
  const getRes = await fetch('https://kil.gserp.id/auth/login');
  const cookies = getRes.headers.getSetCookie ? getRes.headers.getSetCookie() : [getRes.headers.get('set-cookie')];
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
  const html = await getRes.text();
  const csrfMatch = html.match(/name="csrf_gs"\s+value="([^"]+)"/);
  const csrf = csrfMatch ? csrfMatch[1] : '';

  const params = new URLSearchParams();
  params.append('csrf_gs', csrf);
  params.append('email', email);
  params.append('password', password);
  params.append('remember', '1');

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

  const postCookies = postRes.headers.getSetCookie ? postRes.headers.getSetCookie() : [postRes.headers.get('set-cookie')];
  const allCookies = [
    ...cookieHeader.split('; '),
    ...(postCookies.filter(Boolean).map(c => c.split(';')[0]))
  ];
  const authCookie = Array.from(new Set(allCookies)).join('; ');

  // Fetch dashboard
  const dashRes = await fetch('https://kil.gserp.id/', {
    headers: { 'Cookie': authCookie, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const dashHtml = await dashRes.text();

  // Extract all sidebar links
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const links = [];
  let m;
  while ((m = linkRegex.exec(dashHtml)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (href && !href.startsWith('#') && !href.startsWith('javascript') && text) {
      links.push({ text, href });
    }
  }

  console.log(`Found ${links.length} total links in GsERP dashboard.`);
  fs.writeFileSync('scripts/kil_live_links.json', JSON.stringify({ authCookie, links }, null, 2));
  console.log('Saved to scripts/kil_live_links.json');
}

extractNav();
