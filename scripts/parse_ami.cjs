const fs = require('fs');

function parseCSV(text) {
  const p = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') p.push(row);
  return p;
}

const content = fs.readFileSync('docs/reference/AMI - ACTIVITY WORK - JULI (1).csv', 'utf8');
const table = parseCSV(content);

const headers = table[3];
const subheaders = table[4];

const records = [];
for (let r = 5; r < table.length; r++) {
  const row = table[r];
  if (!row || row.length < 5) continue;
  const no = row[1]?.trim();
  const namaClient = row[2]?.trim();
  const sampleProduct = row[7]?.trim();
  if (!no && !namaClient && !sampleProduct) continue;

  records.push({
    id: `AMI-JULI-${r}`,
    tanggal: row[0]?.trim() || '1/7',
    no: no || `${records.length + 1}`,
    namaClient: namaClient || (records[records.length - 1]?.namaClient || '-'),
    namaBrand: row[3]?.trim() || (records[records.length - 1]?.namaBrand || '-'),
    domisili: row[4]?.trim() || (records[records.length - 1]?.domisili || '-'),
    noTelp: row[5]?.trim() || (records[records.length - 1]?.noTelp || '-'),
    prioStandar: row[6]?.trim() || 'STANDAR',
    sampleProduct: sampleProduct || '-',
    rencanaMoq: row[8]?.trim() || '-',
    rencanaBudgetClosing: row[9]?.trim() || '0',
    sample1Npf: row[10]?.trim() || '',
    sample1Delivery: row[11]?.trim() || '',
    revisi1Npf: row[12]?.trim() || '',
    revisi1Delivery: row[13]?.trim() || '',
    revisi2Npf: row[14]?.trim() || '',
    revisi2Delivery: row[15]?.trim() || '',
    statusProgress: row[16]?.trim() || '-',
    terakhirFu: row[17]?.trim() || '',
    nextFu: row[18]?.trim() || '',
    fixFormula: row[19]?.trim() || '-',
    hki: row[20]?.trim() || '-',
    kemasanPrimer: row[21]?.trim() || '-',
    kemasanSekunder: row[22]?.trim() || '-',
    mockUp: row[23]?.trim() || '-',
    tglPermintaan: row[24]?.trim() || '',
    tglDikasih: row[25]?.trim() || '',
    tglTargetDp: row[26]?.trim() || '',
    statusAkhir: row[27]?.trim() || 'PROCESS',
    lostReason: row[28]?.trim() || '',
    source: row[29]?.trim() || '-',
    arahanHeadBd: row[30]?.trim() || '-',
    profilKlien: row[31]?.trim() || '',
    rekomendasiBd: row[32]?.trim() || '-',
  });
}

console.log('Total extracted sample records:', records.length);
fs.writeFileSync('scripts/ami_juli_extracted.json', JSON.stringify(records, null, 2), 'utf8');
