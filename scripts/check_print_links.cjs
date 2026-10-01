const navData = require('./kil_live_links.json');

async function checkPrint() {
  const routes = ['/sales', '/purchase', '/purchase-invoice', '/batch-record', '/request-cogs'];
  for (const r of routes) {
    const res = await fetch(`https://kil.gserp.id${r}`, {
      headers: { 'Cookie': navData.authCookie, 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const printMatches = html.match(/href="([^"]*(?:print|cetak)[^"]*)"/gi) || [];
    const modalMatches = html.match(/data-target="([^"]*)"/gi) || [];
    const ajaxMatches = html.match(/ajaxDetail[a-zA-Z0-9_]*\([^)]+\)/gi) || [];
    console.log(`=== ${r} ===`);
    console.log('Print links:', Array.from(new Set(printMatches)).slice(0, 3));
    console.log('Modal targets:', Array.from(new Set(modalMatches)).slice(0, 3));
    console.log('AJAX details:', Array.from(new Set(ajaxMatches)).slice(0, 3));
  }
}

checkPrint();
