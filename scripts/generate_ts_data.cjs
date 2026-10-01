const fs = require('fs');

const amiData = fs.readFileSync('scripts/ami_juli_extracted.json', 'utf8');
const amiContent = `import { ClientSampleActivityRecord } from "../_types/ami-sample.types";

export const INITIAL_AMI_SAMPLE_RECORDS: ClientSampleActivityRecord[] = ${amiData};
`;

if (!fs.existsSync('frontend/src/app/(dashboard)/penjualan/client-manager/_data')) {
  fs.mkdirSync('frontend/src/app/(dashboard)/penjualan/client-manager/_data', { recursive: true });
}
fs.writeFileSync('frontend/src/app/(dashboard)/penjualan/client-manager/_data/ami-sample-initial.ts', amiContent, 'utf8');
console.log('Written ami-sample-initial.ts');

const dailyData = fs.readFileSync('scripts/daily_tracking_rnd_extracted.json', 'utf8');
const dailyContent = `export interface DailyTrackingRndRecord {
  id: string;
  no: string;
  date: string;
  pic: string;
  npf: string;
  projectSample: string;
  category: string;
  busdev: string;
  taskHariIni: string;
  targetSample: string;
  status: "Done" | "In Progress" | "Failed Trial" | "Pending" | string;
  progressPercent: string;
  kendala: string;
  nextAction: string;
  deadline: string;
}

export const INITIAL_DAILY_TRACKING_RND: DailyTrackingRndRecord[] = ${dailyData};
`;

if (!fs.existsSync('frontend/src/app/(dashboard)/rnd/daily-tracking/_data')) {
  fs.mkdirSync('frontend/src/app/(dashboard)/rnd/daily-tracking/_data', { recursive: true });
}
fs.writeFileSync('frontend/src/app/(dashboard)/rnd/daily-tracking/_data/daily-tracking-initial.ts', dailyContent, 'utf8');
console.log('Written daily-tracking-initial.ts');

const projData = fs.readFileSync('scripts/project_monitoring_rnd_extracted.json', 'utf8');
const projContent = `export interface ProjectMonitoringRndRecord {
  id: string;
  no: string;
  projectName: string;
  pic: string;
  client: string;
  status: string;
  tglNpfMasuk: string;
  tglSelesai: string;
  tglPengiriman: string;
  totalPengerjaan: string;
  folderFormula: string;
  notes: string;
}

export const INITIAL_PROJECT_MONITORING_RND: ProjectMonitoringRndRecord[] = ${projData};
`;

if (!fs.existsSync('frontend/src/app/(dashboard)/rnd/project-monitoring/_data')) {
  fs.mkdirSync('frontend/src/app/(dashboard)/rnd/project-monitoring/_data', { recursive: true });
}
fs.writeFileSync('frontend/src/app/(dashboard)/rnd/project-monitoring/_data/project-monitoring-initial.ts', projContent, 'utf8');
console.log('Written project-monitoring-initial.ts');
