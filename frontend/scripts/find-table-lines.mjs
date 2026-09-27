import fs from "fs";

const file = process.argv[2] || "src/app/(dashboard)/inventory/formula-adjustment-rnd/page.tsx";
const lines = fs.readFileSync(file, "utf-8").split("\n");
lines.forEach((l, i) => {
  if (/<table\b/i.test(l)) {
    console.log(`Line ${i + 1}: ${l}`);
  }
});
