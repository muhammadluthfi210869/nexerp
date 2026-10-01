const fs = require('fs');

async function auditPages() {
  const navData = require('./kil_live_links.json');
  const authCookie = navData.authCookie;

  const targetRoutes = [
    '/sales-sample',
    '/sales',
    '/sales-invoice',
    '/sales-return',
    '/purchase',
    '/purchase-invoice',
    '/purchase-request',
    '/need-for-goods',
    '/goods-request',
    '/batch-record',
    '/formulation',
    '/formulation-manage',
    '/request-cogs',
    '/checklist-progress',
    '/client-sample',
    '/client-production',
    '/client-repeat-order',
    '/client-lost',
    '/purchase-payment',
    '/sales-payment',
    '/purchase-approval',
    '/goods-manage',
    '/supplier-manage',
    '/customer-manage'
  ];

  const results = {};

  for (const route of targetRoutes) {
    try {
      console.log(`Auditing: ${route}...`);
      const res = await fetch(`https://kil.gserp.id${route}`, {
        headers: {
          'Cookie': authCookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      const html = await res.text();

      // Extract title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1].trim() : '';

      // Extract table headers (th)
      const thMatches = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)];
      const headers = thMatches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);

      // Extract buttons
      const btnMatches = [...html.matchAll(/<(?:button|a)[^>]*(?:class="[^"]*btn[^"]*"|type="submit")[^>]*>([\s\S]*?)<\/(?:button|a)>/gi)];
      const buttons = Array.from(new Set(btnMatches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(b => b.length > 1 && b.length < 30)));

      // Check create / action links
      const createLinkMatches = [...html.matchAll(/href="([^"]*(?:create|add|tambah|print|detail|edit)[^"]*)"/gi)];
      const actionLinks = Array.from(new Set(createLinkMatches.map(m => m[1])));

      results[route] = {
        title,
        status: res.status,
        headers,
        buttons,
        actionLinks: actionLinks.slice(0, 10)
      };
    } catch (err) {
      results[route] = { error: err.message };
    }
  }

  // Also audit create forms for key paths
  const createRoutes = [
    '/sales-sample/create',
    '/sales/create',
    '/purchase/create',
    '/goods-request/create',
    '/batch-record/create'
  ];

  results._createForms = {};
  for (const cRoute of createRoutes) {
    try {
      console.log(`Auditing Form: ${cRoute}...`);
      const res = await fetch(`https://kil.gserp.id${cRoute}`, {
        headers: {
          'Cookie': authCookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      const html = await res.text();
      // Extract form input names and labels
      const inputMatches = [...html.matchAll(/<input[^>]+name="([^"]+)"[^>]*>/gi)];
      const selectMatches = [...html.matchAll(/<select[^>]+name="([^"]+)"[^>]*>/gi)];
      const textareaMatches = [...html.matchAll(/<textarea[^>]+name="([^"]+)"[^>]*>/gi)];

      results._createForms[cRoute] = {
        status: res.status,
        inputs: inputMatches.map(m => m[1]),
        selects: selectMatches.map(m => m[1]),
        textareas: textareaMatches.map(m => m[1])
      };
    } catch (err) {
      results._createForms[cRoute] = { error: err.message };
    }
  }

  fs.writeFileSync('scripts/kil_audit_summary.json', JSON.stringify(results, null, 2));
  console.log('Saved audit results to scripts/kil_audit_summary.json');
}

auditPages();
