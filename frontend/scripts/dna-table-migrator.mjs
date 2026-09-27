import fs from "fs";
import path from "path";

export function transformFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const original = content;

  // 1. Cek apakah ada <table> atau alias Table
  const hasRawTable = /<table\b/i.test(content);
  const hasAliasedTable = /from ["']@\/components\/dna["']/.test(content) && /\bTable\b/.test(content);

  if (!hasRawTable && !hasAliasedTable) {
    return { modified: false, reason: "no table found" };
  }

  // 2. Pastikan import DnaTable primitives ada di import @/components/dna
  const dnaPrimitives = ["DnaTable", "DnaTableHead", "DnaTableBody", "DnaTableRow", "DnaTh", "DnaTd"];
  
  const dnaImportRegex = /import\s*\{([^}]+)\}\s*from\s*["']@\/components\/dna["'];?/;
  const dnaImportMatch = content.match(dnaImportRegex);

  if (dnaImportMatch) {
    let importedItems = dnaImportMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    
    // Hapus alias seperti "DnaTable as Table"
    importedItems = importedItems.filter(item => !item.includes(" as Table") && !item.includes(" as TableHead") && !item.includes(" as TableRow") && !item.includes(" as TableCell") && !item.includes(" as TableHeader") && !item.includes(" as TableBody"));

    // Tambahkan primitives jika belum ada
    for (const prim of dnaPrimitives) {
      if (!importedItems.includes(prim)) {
        importedItems.push(prim);
      }
    }
    
    const newImport = `import {\n  ${importedItems.join(",\n  ")},\n} from "@/components/dna";`;
    content = content.replace(dnaImportRegex, newImport);
  } else {
    // Tambahkan import dna baru di bagian atas
    const newImport = `import {\n  ${dnaPrimitives.join(",\n  ")},\n} from "@/components/dna";\n`;
    content = newImport + content;
  }

  // 3. Transform raw table tags
  // Replace <table ...> with <DnaTable>
  content = content.replace(/<table\b[^>]*>/gi, "<DnaTable>");
  content = content.replace(/<\/table>/gi, "</DnaTable>");

  // Replace <thead ...> with <DnaTableHead>
  content = content.replace(/<thead\b[^>]*>/gi, "<DnaTableHead>");
  content = content.replace(/<\/thead>/gi, "</DnaTableHead>");

  // Replace <tbody ...> with <DnaTableBody>
  content = content.replace(/<tbody\b[^>]*>/gi, "<DnaTableBody>");
  content = content.replace(/<\/tbody>/gi, "</DnaTableBody>");

  // Replace <th ...> with <DnaTh ...>
  content = content.replace(/<th\b([^>]*)>/gi, (match, attrs) => `<DnaTh${attrs}>`);
  content = content.replace(/<\/th>/gi, "</DnaTh>");

  // Replace <td ...> with <DnaTd ...>
  content = content.replace(/<td\b([^>]*)>/gi, (match, attrs) => `<DnaTd${attrs}>`);
  content = content.replace(/<\/td>/gi, "</DnaTd>");

  // Replace <tr ...> with <DnaTableRow ...>
  // Hati-hati jangan replace <track atau <tree
  content = content.replace(/<tr\b([^>]*)>/gi, (match, attrs) => `<DnaTableRow${attrs}>`);
  content = content.replace(/<\/tr>/gi, "</DnaTableRow>");

  // 4. Jika ada tag alias Table, TableHead, TableHeader, TableRow, TableCell, TableBody
  content = content.replace(/<TableHeader\b([^>]*)>/g, "<DnaTableHead$1>");
  content = content.replace(/<\/TableHeader>/g, "</DnaTableHead>");
  content = content.replace(/<TableHead\b([^>]*)>/g, "<DnaTh$1>");
  content = content.replace(/<\/TableHead>/g, "</DnaTh>");
  content = content.replace(/<TableCell\b([^>]*)>/g, "<DnaTd$1>");
  content = content.replace(/<\/TableCell>/g, "</DnaTd>");
  content = content.replace(/<TableRow\b([^>]*)>/g, "<DnaTableRow$1>");
  content = content.replace(/<\/TableRow>/g, "</DnaTableRow>");
  content = content.replace(/<TableBody\b([^>]*)>/g, "<DnaTableBody$1>");
  content = content.replace(/<\/TableBody>/g, "</DnaTableBody>");
  content = content.replace(/<Table\b([^>]*)>/g, "<DnaTable$1>");
  content = content.replace(/<\/Table>/g, "</DnaTable>");

  // 5. Normalisasi DnaBadge status -> variant
  content = content.replace(/(<DnaBadge[^>]*)\bstatus="danger"/g, '$1variant="critical"');
  content = content.replace(/(<DnaBadge[^>]*)\bstatus="([^"]+)"/g, '$1variant="$2"');
  content = content.replace(/(<DnaBadge[^>]*)\bstatus=\{/g, '$1variant={');
  content = content.replace(/\bvariant=\{([^}]+)\}/g, (match, expr) => {
    let replaced = expr
      .replace(/"DANGER"/g, '"critical"')
      .replace(/"danger"/g, '"critical"')
      .replace(/"SUCCESS"/g, '"success"')
      .replace(/"WARNING"/g, '"warning"')
      .replace(/"INFO"/g, '"info"')
      .replace(/"DEFAULT"/g, '"default"');
    return `variant={${replaced}}`;
  });

  // 6. Ganti font-mono di table cell dengan tabular-nums
  content = content.replace(/className="([^"]*)\bfont-mono\b([^"]*)"/g, (match, pre, post) => {
    return `className="${pre}tabular-nums${post}"`.replace(/\s+/g, " ").trim();
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf-8");
    return { modified: true };
  }

  return { modified: false, reason: "content unchanged" };
}
