const fs = require('fs');
const path = require('path');
const OUT = __dirname;

// Map URL path -> saved HTML file
const PAGES = [
  ['/customer-manage', 'list', 'customer_manage.html'],
  ['/customer-my-manage', 'list', 'customer_my_manage.html'],
  ['/customer-category-manage', 'list', 'customer_category_manage.html'],
  ['/supplier-manage', 'list', 'supplier_manage.html'],
  ['/supplier-category-manage', 'list', 'supplier_category_manage.html'],
  ['/goods-manage', 'list', 'goods_manage.html'],
  ['/goods-category-manage', 'list', 'goods_category_manage.html'],
  ['/warehouse-manage', 'list', 'warehouse_manage.html'],
  ['/warehouse-access-manage', 'list', 'warehouse_access_manage.html'],
  ['/user-manage', 'list', 'user_manage.html'],
  ['/role-manage', 'list', 'role_manage.html'],
  ['/coa-manage', 'list', 'coa_manage.html'],
  ['/coa-auto-manage', 'list', 'coa_auto_manage.html'],
  ['/formulation-manage', 'list', 'formulation_manage.html'],
  ['/customer-manage/create', 'create', 'customer_manage_create.html'],
  ['/supplier-manage/create', 'create', 'supplier_manage_create.html'],
  ['/goods-manage/create', 'create', 'goods_manage_create.html'],
  ['/warehouse-manage/create', 'create', 'warehouse_manage_create.html'],
  ['/user-manage/create', 'create', 'user_manage_create.html'],
  ['/role-manage/create', 'create', 'role_manage_create.html'],
  ['/coa-manage/create', 'create', 'coa_manage_create.html'],
  ['/formulation-manage/create', 'create', 'formulation_manage_create.html'],
];

function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

function extract(urlPath, type, file) {
  const fp = path.join(OUT, file);
  if (!fs.existsSync(fp)) return { url: urlPath, type, error: 'html missing' };
  const html = fs.readFileSync(fp, 'utf8');
  const out = { url: urlPath, type, file, title: null, forms: [], tables: [], filters: [], actions: [], ajaxEndpoints: [], notes: [] };

  const tm = html.match(/<title>([^<]+)<\/title>/i);
  if (tm) out.title = clean(tm[1]);

  // Forms
  const formRe = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let fm;
  while ((fm = formRe.exec(html)) !== null) {
    const attrs = fm[1];
    const inner = fm[2];
    const action = (attrs.match(/\baction=["']([^"']*)["']/) || [])[1] || null;
    const method = ((attrs.match(/\bmethod=["']([^"']*)["']/) || [])[1] || 'get').toLowerCase();
    const id = (attrs.match(/\bid=["']([^"']*)["']/) || [])[1] || null;

    const fields = [];
    const tagRe = /<(input|select|textarea|button)\b([^>]*?)>([\s\S]*?)<\/\1>|<(input|button)\b([^>]*?)\/?>/gi;
    let m;
    while ((m = tagRe.exec(inner)) !== null) {
      const tag = (m[1] || m[4]).toLowerCase();
      const a = m[2] || m[5] || '';
      if (tag === 'button') continue;
      const name = (a.match(/\bname=["']([^"']+)["']/) || [])[1];
      if (!name) continue;
      const type = (a.match(/\btype=["']([^"']+)["']/) || [, 'text'])[1].toLowerCase();
      const fid = (a.match(/\bid=["']([^"']+)["']/) || [])[1] || null;
      const required = /\brequired\b/i.test(a);
      const placeholder = (a.match(/\bplaceholder=["']([^"']*)["']/) || [])[1] || '';
      const value = (a.match(/\bvalue=["']([^"']*)["']/) || [])[1] || '';
      const pattern = (a.match(/\bpattern=["']([^"']*)["']/) || [])[1] || null;
      const maxlength = (a.match(/\bmaxlength=["']([^"']+)["']/) || [])[1] || null;
      const multiple = /\bmultiple\b/i.test(a);
      const checked = /\bchecked\b/i.test(a);
      let label = '';
      if (fid) {
        const lm = inner.match(new RegExp(`<label[^>]*\\bfor=["']${fid}["'][^>]*>([\\s\\S]*?)</label>`, 'i'));
        if (lm) label = clean(lm[1].replace(/<[^>]+>/g, ' '));
      }
      const isSelect = tag === 'select';
      const isTextarea = tag === 'textarea';
      let options = null;
      if (isSelect) {
        options = [];
        const optRe = /<option\b([^>]*?)(?:\s*\/\s*|>([\s\S]*?))<\/option>/gi;
        let om;
        while ((om = optRe.exec(m[3] || '')) !== null) {
          const oa = om[1] || '';
          const ov = (oa.match(/\bvalue=["']([^"']*)["']/) || [, om[2] || ''])[1];
          const ot = clean((om[2] || '').replace(/<[^>]+>/g, ' ')) || ov;
          options.push({ value: ov, text: ot, selected: /\bselected\b/i.test(oa) });
        }
      }
      fields.push({
        name, type: isSelect ? 'select' : isTextarea ? 'textarea' : type,
        id: fid, required, placeholder, value: value || undefined, pattern, maxlength, multiple, checked,
        label, options,
      });
    }
    out.forms.push({ id, action, method, fieldCount: fields.length, fields });
  }

  // Tables
  const tableRe = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tm2;
  let ti = 0;
  while ((tm2 = tableRe.exec(html)) !== null) {
    ti++;
    const tcontent = tm2[1];
    const ths = [...tcontent.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(x => clean(x[1].replace(/<[^>]+>/g, ' '))).filter(Boolean);
    if (!ths.length) continue;
    const rows = [...tcontent.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
    out.tables.push({ index: ti, headers: ths, rowCount: rows.length });
  }

  // AJAX endpoints (only internal, not menu)
  const ajaxRe = /url\s*[:=]\s*["']([^"']+)["']/g;
  const endpoints = new Set();
  let am;
  while ((am = ajaxRe.exec(html)) !== null) {
    const u = am[1];
    if (/\.(js|css|png|jpg|svg|woff|map)$/i.test(u)) continue;
    if (/^https?:/i.test(u) && !u.includes('kil.gserp.id')) continue;
    if (/^#/.test(u)) continue;
    if (/^javascript:/i.test(u)) continue;
    if (/\/badge$/.test(u)) continue;
    if (u.includes('\\x') || u.includes('&#x')) continue;
    endpoints.add(u);
  }
  out.ajaxEndpoints = [...endpoints];

  // Action buttons
  const btnRe = /<a\b[^>]*\bclass=["'][^"']*\bbtn[^"']*["'][^>]*>([\s\S]*?)<\/a>|<button\b[^>]*\bclass=["'][^"']*\bbtn[^"']*["'][^>]*>([\s\S]*?)<\/button>/gi;
  const btns = [];
  let bm;
  const seen = new Set();
  while ((bm = btnRe.exec(html)) !== null) {
    const a = bm[1] !== undefined ? bm[1] : '';
    const t = clean((bm[3] || '').replace(/<[^>]+>/g, ' '));
    if (!t) continue;
    const href = (a.match(/\bhref=["']([^"']*)["']/) || [])[1] || null;
    const key = t + '|' + href;
    if (seen.has(key)) continue;
    seen.add(key);
    btns.push({ text: t, href });
  }
  out.actions = btns;

  // Add URL
  const addM = html.match(/href=["']([^"']*\/(create|add|baru|new|tambah)\b[^"']*)["']/i);
  if (addM) out.addUrl = addM[1];

  return out;
}

for (const [urlPath, type, file] of PAGES) {
  const slug = urlPath.replace(/^\//, '').replace(/\//g, '_').replace(/[^a-z0-9_]/gi, '_');
  const json = extract(urlPath, type, file);
  fs.writeFileSync(path.join(OUT, slug + '.json'), JSON.stringify(json, null, 2));
}
console.log('Generated ' + PAGES.length + ' per-page JSON files');
