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

// 1. Daily Tracking RND
const dailyContent = fs.readFileSync('docs/reference/Daily_tracking_RND.csv', 'utf8');
const dailyTable = parseCSV(dailyContent);
const dailyRecords = [];

// Header is at row 0: No.,Date,PIC,No.NPF,Project/ Sample,Category,Busdev,Task Hari Ini,Berapa Target Sample hari ini,Status,Progress %,Kendala,Next Action,Deadline
for (let r = 1; r < dailyTable.length; r++) {
  const row = dailyTable[r];
  if (!row || row.length < 3) continue;
  const no = row[0]?.trim();
  const date = row[1]?.trim();
  const pic = row[2]?.trim();
  const npf = row[3]?.trim();
  const project = row[4]?.trim();
  if (!no && !date && !pic && !project) continue;

  dailyRecords.push({
    id: `DAILY-RND-${r}`,
    no: no || `${dailyRecords.length + 1}`,
    date: date || dailyRecords[dailyRecords.length - 1]?.date || '03/08/2026',
    pic: pic || dailyRecords[dailyRecords.length - 1]?.pic || 'Panca',
    npf: npf || '-',
    projectSample: project || '-',
    category: row[5]?.trim() || 'Revisi',
    busdev: row[6]?.trim() || 'Ami',
    taskHariIni: row[7]?.trim() || '-',
    targetSample: row[8]?.trim() || '-',
    status: row[9]?.trim() || 'In Progress',
    progressPercent: row[10]?.trim() || '0%',
    kendala: row[11]?.trim() || '-',
    nextAction: row[12]?.trim() || '-',
    deadline: row[13]?.trim() || '-',
  });
}

console.log('Total Daily Tracking records:', dailyRecords.length);
fs.writeFileSync('scripts/daily_tracking_rnd_extracted.json', JSON.stringify(dailyRecords, null, 2), 'utf8');

// 2. Project Monitoring RND
const projContent = fs.readFileSync('docs/legacy-erp/data/analytics/raw/Project_Monitoring_RND.csv', 'utf8');
const projTable = parseCSV(projContent);
const projRecords = [];

// Header is at row 0: No.,project name,PIC,Client,Status,Tgl NPF masuk,Tgl Selesai,Tgl Pengiriman,Total pengerjaan sample,Folder Formula,Notes
for (let r = 1; r < projTable.length; r++) {
  const row = projTable[r];
  if (!row || row.length < 3) continue;
  const projectName = row[1]?.trim();
  if (!projectName) continue;

  projRecords.push({
    id: `PROJ-RND-${r}`,
    no: row[0]?.trim() || `${projRecords.length + 1}`,
    projectName,
    pic: row[2]?.trim() || 'Panca',
    client: row[3]?.trim() || '-',
    status: row[4]?.trim() || 'Terkirim',
    tglNpfMasuk: row[5]?.trim() || '7/29/2026',
    tglSelesai: row[6]?.trim() || '',
    tglPengiriman: row[7]?.trim() || '',
    totalPengerjaan: row[8]?.trim() || '-',
    folderFormula: row[9]?.trim() || '-',
    notes: row[10]?.trim() || '',
  });
}

console.log('Total Project Monitoring records:', projRecords.length);
fs.writeFileSync('scripts/project_monitoring_rnd_extracted.json', JSON.stringify(projRecords, null, 2), 'utf8');
