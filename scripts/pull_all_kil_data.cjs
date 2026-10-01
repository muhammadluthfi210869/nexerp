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

async function login() {
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
      'User-Agent': 'Mozilla/5.0'
    },
    body: params.toString(),
    redirect: 'manual'
  });

  const postCookies = postRes.headers.getSetCookie ? postRes.headers.getSetCookie() : [postRes.headers.get('set-cookie')];
  const allCookies = [
    ...cookieHeader.split('; '),
    ...(postCookies.filter(Boolean).map(c => c.split(';')[0]))
  ];
  return Array.from(new Set(allCookies)).join('; ');
}

function parseUsers(html) {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const users = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const tds = [];
    const tdMatches = row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    for (const m of tdMatches) {
      tds.push(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
    if (tds.length >= 6) {
      users.push({
        no: parseInt(tds[0], 10),
        nip: tds[1],
        name: tds[2],
        email: tds[3],
        phone: tds[4],
        role: tds[5]
      });
    }
  }
  return users;
}

function parseView(viewHtml) {
  const nameMatch = viewHtml.match(/<strong>Nama Role<\/strong><\/td>\s*<td[^>]*>:<\/td>\s*<td>\s*<button[^>]*>([\s\S]*?)<\/button>/i);
  const roleName = nameMatch ? nameMatch[1].trim() : '';

  const countMatch = viewHtml.match(/<span class="badge badge-info">\s*(\d+)\s*Modul/i);
  const totalModul = countMatch ? parseInt(countMatch[1], 10) : 0;

  const sections = viewHtml.split(/<div class="mb-3">/gi);
  const modules = [];

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const h5Match = section.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i);
    if (!h5Match) continue;
    const moduleGroup = h5Match[1].replace(/<[^>]+>/g, '').trim();

    const items = [];
    const liMatches = section.matchAll(/<li class="list-group-item[^"]*">([\s\S]*?)<\/li>/gi);
    for (const li of liMatches) {
      const liHtml = li[1];
      const badgeMatch = liHtml.match(/<span class="badge[^"]*">([\s\S]*?)<\/span>/i);
      const slug = badgeMatch ? badgeMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const label = liHtml.replace(/<span[\s\S]*?<\/span>/gi, '').replace(/<[^>]+>/g, '').trim();
      items.push({ label, slug });
    }

    modules.push({
      group: moduleGroup,
      subItems: items
    });
  }

  return {
    roleName,
    totalModul,
    modules
  };
}

async function run() {
  console.log('Logging in...');
  const authCookie = await login();
  console.log('Logged in successfully.');

  // 1. Get Users
  console.log('Fetching users...');
  const userRes = await fetch('https://kil.gserp.id/user-manage', {
    headers: { 'Cookie': authCookie, 'User-Agent': 'Mozilla/5.0' }
  });
  const userHtml = await userRes.text();
  const users = parseUsers(userHtml);
  console.log(`Found ${users.length} users.`);

  // 2. Get Roles
  console.log('Fetching roles list...');
  const roleRes = await fetch('https://kil.gserp.id/role-manage', {
    headers: { 'Cookie': authCookie, 'User-Agent': 'Mozilla/5.0' }
  });
  const roleHtml = await roleRes.text();
  const roleIdMatches = roleHtml.matchAll(/ajaxDetail\('(\d+)'/gi);
  const roleIds = Array.from(new Set(Array.from(roleIdMatches).map(m => m[1])));
  console.log(`Found ${roleIds.length} role IDs:`, roleIds);

  // 3. For each role, fetch details
  const rolesData = [];
  for (const rid of roleIds) {
    console.log(`Fetching detail for role ID ${rid}...`);
    const dRes = await fetch(`https://kil.gserp.id/role-manage/detail?id=${rid}`, {
      headers: { 'Cookie': authCookie, 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest' }
    });
    const dJson = await dRes.json();
    const parsed = parseView(dJson.view);
    rolesData.push({
      id: rid,
      ...parsed
    });
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    sourceUrl: 'https://kil.gserp.id',
    totalUsers: users.length,
    users,
    totalRoles: rolesData.length,
    roles: rolesData
  };

  fs.writeFileSync('scripts/kil_full_extracted_data.json', JSON.stringify(output, null, 2));
  console.log('Saved to scripts/kil_full_extracted_data.json');
}

run().catch(console.error);
