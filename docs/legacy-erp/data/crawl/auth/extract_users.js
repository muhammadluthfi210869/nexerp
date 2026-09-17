const fs = require('fs');
const path = require('path');
const baseDir = __dirname;
const files = fs.readdirSync(path.join(baseDir, 'user_details')).filter(f => f.endsWith('.json')).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0]));
const users = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(baseDir, 'user_details', f), 'utf8'));
  if (!d.view) { users.push({id: parseInt(f.match(/\d+/)[0]), error: 'no view'}); continue; }
  const view = d.view;
  function getRow(key) {
    // Split into rows; find row whose <strong> matches key
    const rowRe = /<tr>[\s\S]*?<\/tr>/g;
    let m;
    while ((m = rowRe.exec(view)) !== null) {
      const row = m[0];
      if (row.indexOf('<strong>' + key + '</strong>') === -1) continue;
      const tds = [];
      const tdRe = /<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/g;
      let tm;
      while ((tm = tdRe.exec(row)) !== null) {
        tds.push(tm[1]);
      }
      if (tds.length < 3) return null;
      return tds[2].replace(/<[^>]+>/g, '').trim();
    }
    return null;
  }
  const name = getRow('Nama');
  const code = getRow('Kode/NIP');
  const email = getRow('Email');
  const phone = getRow('Nomor Telepon');
  const roleRaw = getRow('Role');
  const statusRaw = getRow('Status');
  const tglBergabung = getRow('Tanggal Bergabung');
  const lastLogin = getRow('(?:Login Terakhir|Last Login|Terakhir Login|Last Seen)');
  const photoMatch = view.match(/<img class="profile-user-img[^"]*"\s+src="([^"]+)"/);

  const id = parseInt(f.match(/\d+/)[0]);
  const photo = photoMatch ? photoMatch[1].replace(/&#x3A;/g,':').replace(/&#x2F;/g,'/').replace(/&amp;/g,'&') : null;
  users.push({
    id: id,
    name: name || null,
    code: code || null,
    email: email || null,
    phone: phone || null,
    role_name: roleRaw || null,
    status: statusRaw || null,
    tgl_bergabung: tglBergabung || null,
    photo_url: photo,
    last_login: lastLogin || null
  });
}
fs.writeFileSync(path.join(baseDir, 'users_extracted.json'), JSON.stringify(users, null, 2));
console.log('Total users:', users.length);
console.log('Sample:', JSON.stringify(users[0], null, 2));
console.log('Last:', JSON.stringify(users[users.length-1], null, 2));
