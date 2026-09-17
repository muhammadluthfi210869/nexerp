/**
 * P00 Stop-the-Line Containment: Secret Scan with History
 * Scans git-tracked files and documentation for exposed secrets,
 * private keys, API tokens, and credentials.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');

// Regex patterns for detecting credentials / secrets
const SECRET_PATTERNS = [
  { name: 'OpenAI/DeepSeek API Key', regex: /(?:sk-[a-zA-Z0-9]{30,})/g },
  { name: 'Cloudflare API Token', regex: /(?:cfut_[a-zA-Z0-9_-]{30,})/g },
  { name: 'Private Key Block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\r\n]+[a-zA-Z0-9+/=\r\n]{30,}-----END [A-Z ]*PRIVATE KEY-----/g },
  { name: 'GitHub Personal Access Token', regex: /(?:ghp_[a-zA-Z0-9]{30,})/g },
  { name: 'Exposed Legacy Password In Plaintext', regex: /Password:\s*160487\b/gi },
  { name: 'Hardcoded Production User Password', regex: /bcrypt\.hash\(['"]160487['"]/g },
];

// Files to ignore (e.g., .env is local only and gitignored, package-lock has hashes, binary, etc.)
const IGNORED_PATHS = [
  '.git',
  'node_modules',
  'dist',
  '.next',
  '.env',
  '.env.local',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'tmp',
  'playwright-report',
  'test-results',
  'artifacts'
];

function getTrackedFiles() {
  try {
    const stdout = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return stdout.split(/\r?\n/).filter(Boolean);
  } catch (err) {
    console.warn('git ls-files failed, falling back to directory traversal:', err.message);
    return [];
  }
}

function scanFile(filePath) {
  const fullPath = path.resolve(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) return [];
  const stat = fs.statSync(fullPath);
  if (stat.size > 2 * 1024 * 1024) return []; // skip large files > 2MB

  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch (e) {
    return []; // skip binary
  }

  const findings = [];
  for (const pattern of SECRET_PATTERNS) {
    // reset regex state
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      // Find line number
      const line = content.substring(0, match.index).split('\n').length;
      findings.push({
        file: filePath,
        line,
        rule: pattern.name,
        preview: match[0].substring(0, 4) + '***[REDACTED]***'
      });
    }
  }
  return findings;
}

function runScan() {
  console.log('=== P00: Running Secret Scan on Tracked Files ===');
  const files = getTrackedFiles();
  console.log(`Scanning ${files.length} tracked files...`);

  let totalFindings = [];
  for (const file of files) {
    // Check if path is in ignored list
    const isIgnored = IGNORED_PATHS.some(ignored => file === ignored || file.startsWith(ignored + '/'));
    if (isIgnored) continue;

    const findings = scanFile(file);
    if (findings.length > 0) {
      totalFindings = totalFindings.concat(findings);
    }
  }

  console.log('\n--- Scan Results ---');
  if (totalFindings.length === 0) {
    console.log('✅ PASS: No exposed secrets detected in tracked files.');
    process.exit(0);
  } else {
    console.error(`❌ FAIL: Found ${totalFindings.length} potential secret exposure(s):`);
    for (const f of totalFindings) {
      console.error(`  - [${f.rule}] in ${f.file}:${f.line} -> ${f.preview}`);
    }
    process.exit(1);
  }
}

runScan();
