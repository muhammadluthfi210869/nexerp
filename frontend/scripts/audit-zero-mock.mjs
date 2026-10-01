import fs from "fs";
import path from "path";

const APP_DIR = path.resolve("src/app/(dashboard)");

function walk(dir, cb) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules" && ent.name !== ".next" && ent.name !== "__tests__") {
      walk(p, cb);
    } else if (ent.isFile() && ent.name.endsWith(".tsx")) {
      cb(p);
    }
  }
}

const mockStats = {
  explicitMockData: [],
  useQueryPages: [],
  apiClientPages: [],
  pureStateMock: [],
};

walk(APP_DIR, (fp) => {
  const code = fs.readFileSync(fp, "utf-8");
  const rel = path.relative(process.cwd(), fp).replace(/\\/g, "/");

  const hasMock = /\b(mockData|MOCK_|dummyData|DUMMY_|dummyList|mockRows)\b/i.test(code);
  const hasQuery = code.includes("useQuery") || code.includes("useMutation") || code.includes("@tanstack/react-query");
  const hasApi = code.includes("api.") || code.includes("apiClient") || code.includes("fetch(") || code.includes("axios");

  if (hasMock) {
    mockStats.explicitMockData.push(rel);
  }
  if (hasQuery) {
    mockStats.useQueryPages.push(rel);
  }
  if (hasApi) {
    mockStats.apiClientPages.push(rel);
  }
  if (!hasQuery && !hasApi && (code.includes("useState") || code.includes("Table"))) {
    mockStats.pureStateMock.push(rel);
  }
});

console.log("================================================================");
console.log("             ZERO-MOCK & BACKEND PLUMBING AUDIT                ");
console.log("================================================================");
console.log("1. Berkas dengan kata kunci MOCK/DUMMY eksplisit              :", mockStats.explicitMockData.length);
console.log("2. Berkas yang aktif menggunakan TanStack React Query         :", mockStats.useQueryPages.length);
console.log("3. Berkas yang memanggil API Client langsung                  :", mockStats.apiClientPages.length);
console.log("4. Berkas tabel/state yang TANPA koneksi API sama sekali      :", mockStats.pureStateMock.length);
console.log("================================================================");

if (mockStats.explicitMockData.length > 0) {
  console.log("\n[SAMPLE BERKAS YANG MASIH MEMILIKI DUMMY/MOCK DATA]:");
  mockStats.explicitMockData.slice(0, 15).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}

if (mockStats.pureStateMock.length > 0) {
  console.log("\n[SAMPLE BERKAS BERPOTENSI ORPHAN / TANPA KONEKSI API]:");
  mockStats.pureStateMock.slice(0, 15).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}
