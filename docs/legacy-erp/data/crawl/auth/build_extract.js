const fs = require('fs');
const path = require('path');
const baseDir = __dirname;

const modules = JSON.parse(fs.readFileSync(path.join(baseDir, 'role_modules_extracted.json'), 'utf8'));
const users = JSON.parse(fs.readFileSync(path.join(baseDir, 'users_extracted.json'), 'utf8'));
const rolePerms = JSON.parse(fs.readFileSync(path.join(baseDir, 'role_permissions.json'), 'utf8'));

const roleNames = {
  '1': 'Administrator', '2': 'HRD', '3': 'Staff Back Office', '4': 'Purchasing',
  '5': 'Warehouse', '6': 'Head Business Development', '7': 'Business Development',
  '8': 'Head Research and Development', '9': 'Research and Development',
  '10': 'Production Mixing & Filling', '11': 'Production Packaging',
  '12': 'Apoteker Penanggung Jawab', '13': 'Finance', '14': 'Digital Marketing',
  '15': 'BusDev + HRD', '16': 'BusDev + Purchasing'
};

const roles = [];
for (let i = 1; i <= 16; i++) {
  const d = JSON.parse(fs.readFileSync(path.join(baseDir, 'role_details', 'role_' + i + '.json'), 'utf8'));
  const view = d.view;
  const totalMatch = view.match(/(\d+)\s*Modul/);
  const total = totalMatch ? parseInt(totalMatch[1]) : null;
  const usersByName = {};
  for (const u of users) usersByName[u.role_name] = (usersByName[u.role_name] || 0) + 1;
  roles.push({
    id: i,
    name: roleNames[String(i)],
    module_count_displayed: total,
    users_count: usersByName[roleNames[String(i)]] || 0,
    dashboard_modules_count: modules[i].dashboard_modules.length,
    sub_modules_count: modules[i].sub_modules.length,
    status: 'Aktif',
    module_tree_shape: {
      dashboard_modules: modules[i].dashboard_modules,
      sub_modules: modules[i].sub_modules.map(m => m.slug)
    }
  });
}

const permissionsSample = {};
['1', '7', '13', '3'].forEach(rid => {
  permissionsSample[rid] = rolePerms[rid];
});

const sessionConfig = {
  cookie_name_session: 'ci_session',
  cookie_name_csrf: 'csrf_cookie_gs',
  csrf_form_field: 'csrf_gs',
  remember_me_checkbox: 'remember=1',
  recaptcha_v2: 'grecaptcha (site key from setting page)',
  recaptcha_site_key: '6LdkxfMpAAAAADsmqCk-NXoVFymJ9RN5VesPdWvt',
  recaptcha_secret_key: '6LdkxfMpAAAAADd_a5ui_1kipwo6T3DSGEAiCu3G',
  framework: 'CodeIgniter 3.x (ci_session cookie, csrf_gs field, csrf_cookie_gs cookie — matches CI3 CSRF regeneration pattern)',
  login_post_redirect: '303 to / (dashboard)',
  session_cookie_httponly: true,
  session_cookie_secure_flag: false,
  cookie_expiry_hints: 'ci_session expiry ~10 hours (Unix 1789566589 = 2026-09-17 04:43 UTC; logged in at ~18:43 local)',
  password_reset_link_visible: '/auth/forgot (accessible only when logged out; redirects to / when authenticated)'
};

const passwordHashing = {
  scheme: 'unknown_from_dom (DB not exposed)',
  candidate_algorithms: [
    'bcrypt ($2y$ prefix) — common in CodeIgniter with password_hash() default',
    'MD5 (legacy CI has md5 helper)',
    'SHA1'
  ],
  evidence: [
    'CodeIgniter 3.x framework (ci_session cookie, csrf_gs field convention)',
    'No client-side hashing JS observed in login.html (password sent plaintext over HTTPS)',
    'Strong password client-side validator (regex /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%&])(.{8,20}$)/) — UI-only',
    'Settings page exposes app name, version=2.0.0, recaptcha keys, copyright, copyrightUrl only — no password policy / session timeout in admin settings'
  ]
};

const passwordPolicy = {
  min_length: 8,
  max_length: 20,
  requires: {
    uppercase: true,
    lowercase: true,
    digit: true,
    special_chars_allowed: '@#$%&'
  },
  evidence: 'JS validator strong_password method on user-manage/create page and account page'
};

const auditLogColumns = ['timestamp', 'user_name', 'user_email', 'module', 'action', 'description', 'ip_address'];
const auditLogModules = ['User', 'Role', 'Account', 'Setting', 'Auth', 'Formulation', 'Coa', 'Warehouse', 'Goods', 'Purchase', 'Supplier', 'Customer', 'Checklist', 'Sales', 'Leads'];
const auditLogActions = ['View', 'Create', 'Update'];
const auditLogRetentionHints = 'Activity log page rendered 4,989 rows in single HTML load — no date filter in URL; long retention (legacy ERP convention: never purge)';

const extract = {
  source: 'https://kil.gserp.id',
  crawl_date: new Date().toISOString().slice(0, 10),
  users: users,
  users_count: users.length,
  roles: roles,
  roles_count: roles.length,
  permissions_sample: permissionsSample,
  all_unique_sub_modules: [...new Set([].concat(...Object.values(modules).map(m => m.sub_modules.map(s => s.slug))))].sort(),
  all_unique_dashboard_modules: [...new Set([].concat(...Object.values(modules).map(m => m.dashboard_modules)))].sort(),
  password_hashing_evidence: passwordHashing,
  password_policy_evidence: passwordPolicy,
  session_config: sessionConfig,
  audit_log_columns: auditLogColumns,
  audit_log_modules: auditLogModules,
  audit_log_actions: auditLogActions,
  audit_log_retention_hints: auditLogRetentionHints,
  audit_log_visible_rows: 4989
};

fs.writeFileSync(path.join(baseDir, '_auth_extract.json'), JSON.stringify(extract, null, 2));
console.log('Saved _auth_extract.json');
console.log('Total users:', extract.users_count);
console.log('Total roles:', extract.roles_count);
console.log('Unique sub modules:', extract.all_unique_sub_modules.length);
console.log('Unique dashboards:', extract.all_unique_dashboard_modules.length);
