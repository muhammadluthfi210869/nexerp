const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../frontend/src/components/dna/DnaInteractiveElements.tsx');
const destDir = path.join(__dirname, '../frontend/src/components/dna/dna-interactive');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split(/\r?\n/);

// Helpers
function getLines(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

// 1. inputs.tsx (lines 26 to 331)
const inputsContent = `"use client";

import React, { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Switch as RawSwitch } from "@/components/ui/switch";
import { ChevronDown, Search, Check } from "lucide-react";

${getLines(26, 331).trim()}
`;

// 2. modals.tsx (lines 372 to 602)
const modalsContent = `"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DnaButton } from "../DnaButton";
import { X, AlertTriangle } from "lucide-react";

${getLines(372, 602).trim()}
`;

// 3. result-print.tsx (lines 604 to 926)
const resultPrintContent = `"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DnaButton } from "../DnaButton";
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Check,
  ChevronDown,
  X,
} from "lucide-react";

${getLines(604, 926).trim()}
`;

// 4. workflow.tsx (lines 928 to 1188)
const workflowContent = `"use client";

import React from "react";
import { cn, formatRupiah } from "@/lib/utils";
import { DnaButton } from "../DnaButton";
import { Plus, Trash2, Check } from "lucide-react";

${getLines(928, 1188).trim()}
`;

// 5. toast.tsx (lines 1190 to 1221 + lines 1553 to 1558)
const toastContent = `"use client";

import React from "react";

${getLines(1190, 1221).trim()}

${getLines(1553, 1558).trim()}
`;

// 6. layout.tsx (lines 333 to 370 + lines 1223 to 1551)
const layoutContent = `"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DnaButton } from "../DnaButton";

${getLines(333, 370).trim()}

${getLines(1223, 1551).trim()}
`;

// 7. index.ts barrel
const indexContent = `"use client";

export * from "./inputs";
export * from "./modals";
export * from "./result-print";
export * from "./workflow";
export * from "./toast";
export * from "./layout";
`;

// 8. New DnaInteractiveElements.tsx facade
const facadeContent = `"use client";

/**
 * DnaInteractiveElements facade.
 * Decomposed in Fase 4 (Slice 4.1) into atomic sub-modules under ./dna-interactive/
 * Retains 100% backward-compatible re-exports for all public symbols and types.
 */

export * from "./dna-interactive";
`;

// Write all files
fs.writeFileSync(path.join(destDir, 'inputs.tsx'), inputsContent, 'utf8');
fs.writeFileSync(path.join(destDir, 'modals.tsx'), modalsContent, 'utf8');
fs.writeFileSync(path.join(destDir, 'result-print.tsx'), resultPrintContent, 'utf8');
fs.writeFileSync(path.join(destDir, 'workflow.tsx'), workflowContent, 'utf8');
fs.writeFileSync(path.join(destDir, 'toast.tsx'), toastContent, 'utf8');
fs.writeFileSync(path.join(destDir, 'layout.tsx'), layoutContent, 'utf8');
fs.writeFileSync(path.join(destDir, 'index.ts'), indexContent, 'utf8');
fs.writeFileSync(srcPath, facadeContent, 'utf8');

console.log('Successfully decomposed DnaInteractiveElements.tsx into 6 sub-modules + barrel + facade.');
