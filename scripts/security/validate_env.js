/**
 * P00 Stop-the-Line Containment: Environment Validation Script
 * Verifies syntax, schema, quotation, and gitignore safety for .env files.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

const REQUIRED_PRODUCTION_KEYS = [
  'DOMAIN_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'AES_SECRET_KEY',
  'CORS_ORIGIN',
  'NEXT_PUBLIC_API_URL',
  'WA_WEBHOOK_VERIFY_TOKEN'
];

function validateEnvFile(filePath) {
  const fullPath = path.resolve(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    return [`File does not exist: ${filePath}`];
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const errors = [];
  const parsedKeys = new Set();

  lines.forEach((rawLine, index) => {
    const lineNum = index + 1;
    const trimmed = rawLine.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // Check for spaces around '=': e.g. "KEY = VALUE" or "KEY =VALUE" or "KEY= VALUE"
    // Valid syntax is KEY=VALUE
    const equalIndex = rawLine.indexOf('=');
    if (equalIndex === -1) {
      errors.push(`${filePath}:${lineNum} Missing '=' delimiter in line: "${trimmed}"`);
      return;
    }

    const keyPart = rawLine.substring(0, equalIndex);
    const valuePart = rawLine.substring(equalIndex + 1);

    // Key must not have trailing whitespace, and value must not have leading whitespace (unless intentional inside quotes)
    if (/\s+$/.test(keyPart) || /^\s+/.test(valuePart)) {
      errors.push(`${filePath}:${lineNum} Invalid whitespace around '=' for key "${keyPart.trim()}"`);
    }

    const key = keyPart.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      errors.push(`${filePath}:${lineNum} Invalid environment variable name "${key}"`);
    }

    // Check quote balancing if value starts with quote
    const trimmedValue = valuePart.trim();
    if (trimmedValue.startsWith('"') || trimmedValue.startsWith("'")) {
      const quoteChar = trimmedValue[0];
      if (trimmedValue.length < 2 || !trimmedValue.endsWith(quoteChar)) {
        errors.push(`${filePath}:${lineNum} Unclosed quote for key "${key}"`);
      } else {
        // Check for unescaped nested quotes inside double-quoted string
        if (quoteChar === '"') {
          const inner = trimmedValue.substring(1, trimmedValue.length - 1);
          // Look for unescaped "
          const unescapedQuoteMatch = inner.match(/(?<!\\)"/);
          if (unescapedQuoteMatch) {
            errors.push(`${filePath}:${lineNum} Unescaped double quote inside string for key "${key}"`);
          }
        }
      }
    }

    parsedKeys.add(key);
  });

  return { errors, parsedKeys };
}

function checkGitIgnore() {
  const gitignorePath = path.resolve(ROOT_DIR, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return ['.gitignore file missing'];
  }
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split(/\r?\n/).map(l => l.trim());
  const errors = [];

  if (!lines.includes('.env')) {
    errors.push('.gitignore does not explicitly ignore .env');
  }
  return errors;
}

function runValidation() {
  console.log('=== P00: Running Environment & Schema Validation ===');
  let allErrors = [];

  // 1. Check .gitignore safety
  const gitignoreErrors = checkGitIgnore();
  allErrors = allErrors.concat(gitignoreErrors);

  // 2. Validate .env syntax IF IT EXISTS. `.env` is a gitignored local secret,
  //    so a clean CI checkout and a fresh clone legitimately have none — only a
  //    present-but-malformed file is an error. Absence is reported by
  //    validateEnvFile() as a bare array of strings.
  const envResult = validateEnvFile('.env');
  if (!Array.isArray(envResult)) {
    allErrors = allErrors.concat(envResult.errors);
  }

  // 3. Validate .env.production.example syntax and required keys
  const exampleResult = validateEnvFile('.env.production.example');
  if (Array.isArray(exampleResult)) {
    allErrors = allErrors.concat(exampleResult);
  } else {
    allErrors = allErrors.concat(exampleResult.errors);
    for (const reqKey of REQUIRED_PRODUCTION_KEYS) {
      if (!exampleResult.parsedKeys.has(reqKey)) {
        allErrors.push(`.env.production.example missing required key: "${reqKey}"`);
      }
    }
  }

  console.log('\n--- Validation Results ---');
  if (allErrors.length === 0) {
    console.log('✅ PASS: All environment files and schemas are valid and syntax-compliant.');
    process.exit(0);
  } else {
    console.error(`❌ FAIL: Found ${allErrors.length} environment validation error(s):`);
    allErrors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

runValidation();
