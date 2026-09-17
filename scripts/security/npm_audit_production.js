/**
 * P00 Stop-the-Line Containment: Production Dependency Audit Gate
 * Validates that all production dependency vulnerabilities are cataloged
 * and mapped to an approved remediation path.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '../..');

// Approved remediation registry for P00 exit gate
// Every critical or high production finding must have an assigned owner phase,
// rationale, and remediation mechanism.
const APPROVED_REMEDIATIONS = {
  backend: {
    'multer': { targetPhase: 'P05', plan: 'Configure custom multipart stream or upgrade NestJS platform express in P05 platform controls.' },
    '@nestjs/core': { targetPhase: 'P05', plan: 'Transitive via multer; upgraded in P05 platform controls.' },
    '@nestjs/event-emitter': { targetPhase: 'P05', plan: 'Transitive via @nestjs/core/multer; upgraded in P05.' },
    '@nestjs/platform-express': { targetPhase: 'P05', plan: 'Direct consumer of multer; upgraded in P05.' },
    '@nestjs/platform-socket.io': { targetPhase: 'P05', plan: 'Transitive via @nestjs/websockets/multer; upgraded in P05.' },
    '@nestjs/schedule': { targetPhase: 'P05', plan: 'Transitive via @nestjs/core/multer; upgraded in P05.' },
    '@nestjs/serve-static': { targetPhase: 'P05', plan: 'Transitive via @nestjs/core/multer; upgraded in P05.' },
    '@nestjs/swagger': { targetPhase: 'P05', plan: 'Transitive via @nestjs/core/multer; upgraded in P05.' },
    '@nestjs/websockets': { targetPhase: 'P05', plan: 'Transitive via @nestjs/core/multer; upgraded in P05.' },
    'deepmerge-ts': { targetPhase: 'P04', plan: 'Update Prisma toolchain and schema migration chain in P04.' },
    '@prisma/config': { targetPhase: 'P04', plan: 'Transitive via deepmerge-ts; updated in P04 migration chain.' },
    'prisma': { targetPhase: 'P04', plan: 'Transitive via @prisma/config; updated in P04 migration chain.' },
    'mysql2': { targetPhase: 'P04', plan: 'Unused indirect DB driver (PostgreSQL only); pruned during P04 Prisma alignment.' },
    'html-pdf-node': { targetPhase: 'P17', plan: 'Replace legacy html-pdf-node with modern PDF generation engine in P17.' },
    'puppeteer': { targetPhase: 'P17', plan: 'Transitive via html-pdf-node; eliminated with html-pdf-node replacement in P17.' },
    'tar-fs': { targetPhase: 'P17', plan: 'Transitive via puppeteer inside html-pdf-node; replaced in P17.' },
    'ws': { targetPhase: 'P17', plan: 'Transitive via puppeteer inside html-pdf-node; replaced in P17.' },
    'extract-zip': { targetPhase: 'P17', plan: 'Transitive via puppeteer inside html-pdf-node; replaced in P17.' },
    'node-fetch': { targetPhase: 'P17', plan: 'Transitive via puppeteer inside html-pdf-node; replaced in P17.' },
    'lodash.pick': { targetPhase: 'P17', plan: 'Transitive via inline-css inside html-pdf-node; replaced in P17.' },
    'nth-check': { targetPhase: 'P17', plan: 'Transitive via cheerio inside html-pdf-node; replaced in P17.' },
    'cheerio': { targetPhase: 'P17', plan: 'Transitive via html-pdf-node; replaced in P17.' },
    'css-select': { targetPhase: 'P17', plan: 'Transitive via cheerio inside html-pdf-node; replaced in P17.' },
    'extract-css': { targetPhase: 'P17', plan: 'Transitive via inline-css inside html-pdf-node; replaced in P17.' },
    'inline-css': { targetPhase: 'P17', plan: 'Transitive via html-pdf-node; replaced in P17.' },
    'list-stylesheets': { targetPhase: 'P17', plan: 'Transitive via inline-css inside html-pdf-node; replaced in P17.' },
    'style-data': { targetPhase: 'P17', plan: 'Transitive via inline-css inside html-pdf-node; replaced in P17.' }
  },
  frontend: {
    'next': { targetPhase: 'P03', plan: 'Upgrade Next.js to latest stable patched release in P03 build alignment.' },
    'postcss': { targetPhase: 'P03', plan: 'Apply npm override for postcss >=8.5.28 in P03 package configuration.' },
    'sharp': { targetPhase: 'P03', plan: 'Upgrade sharp to >=0.35.4 in P03.' },
    'hono': { targetPhase: 'P03', plan: 'Upgrade hono dependency to latest patched release in P03.' },
    'nanoid': { targetPhase: 'P03', plan: 'Update nanoid to >=3.3.18 / 5.x in P03.' },
    'js-yaml': { targetPhase: 'P03', plan: 'Update js-yaml parser dependency in P03.' },
    'ip-address': { targetPhase: 'P03', plan: 'Transitive lockfile resolution in P03.' },
    'fast-uri': { targetPhase: 'P03', plan: 'Transitive lockfile resolution in P03.' },
    'form-data': { targetPhase: 'P03', plan: 'Transitive dependency resolution in P03.' },
    'axios': { targetPhase: 'P03', plan: 'Update axios HTTP client to patched release in P03.' },
    'brace-expansion': { targetPhase: 'P03', plan: 'Transitive lockfile resolution in P03.' },
    'browserslist': { targetPhase: 'P03', plan: 'Update browserslist data via npx update-browserslist-db in P03.' }
  }
};

function runAudit(targetDir, domain) {
  console.log(`\nAuditing production dependencies for ${domain} (${targetDir})...`);
  let stdout = '';
  try {
    stdout = execSync('npm audit --omit=dev --json', {
      cwd: targetDir,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (err) {
    // npm audit returns exit code 1 when vulnerabilities are found
    stdout = err.stdout || '';
  }

  if (!stdout) {
    throw new Error(`Failed to retrieve audit output for ${domain}`);
  }

  let report;
  try {
    report = JSON.parse(stdout);
  } catch (e) {
    throw new Error(`Failed to parse npm audit JSON output for ${domain}: ${e.message}`);
  }

  const vulnerabilities = report.vulnerabilities || {};
  const unapproved = [];
  const approvedList = [];

  for (const [pkg, info] of Object.entries(vulnerabilities)) {
    const severity = info.severity;
    if (severity === 'critical' || severity === 'high') {
      const approved = APPROVED_REMEDIATIONS[domain] && APPROVED_REMEDIATIONS[domain][pkg];
      if (approved) {
        approvedList.push({ package: pkg, severity, phase: approved.targetPhase, plan: approved.plan });
      } else {
        unapproved.push({ package: pkg, severity, via: info.via });
      }
    }
  }

  return { domain, approvedList, unapproved, metadata: report.metadata };
}

function main() {
  console.log('=== P00: Production Dependency Vulnerability & Remediation Gate ===');

  const backendDir = path.resolve(ROOT_DIR, 'backend');
  const frontendDir = path.resolve(ROOT_DIR, 'frontend');

  const backendAudit = runAudit(backendDir, 'backend');
  const frontendAudit = runAudit(frontendDir, 'frontend');

  console.log('\n--- Backend Summary ---');
  console.log(`Total dependencies: ${backendAudit.metadata?.dependencies?.total || 'N/A'}`);
  console.log(`Cataloged critical/high with approved remediation: ${backendAudit.approvedList.length}`);
  backendAudit.approvedList.forEach(item => {
    console.log(`  [${item.severity.toUpperCase()}] ${item.package} -> Target: ${item.phase} (${item.plan})`);
  });

  console.log('\n--- Frontend Summary ---');
  console.log(`Total dependencies: ${frontendAudit.metadata?.dependencies?.total || 'N/A'}`);
  console.log(`Cataloged critical/high with approved remediation: ${frontendAudit.approvedList.length}`);
  frontendAudit.approvedList.forEach(item => {
    console.log(`  [${item.severity.toUpperCase()}] ${item.package} -> Target: ${item.phase} (${item.plan})`);
  });

  const totalUnapproved = backendAudit.unapproved.length + frontendAudit.unapproved.length;
  if (totalUnapproved > 0) {
    console.error(`\n❌ FAIL: ${totalUnapproved} critical/high vulnerability(ies) have NO approved remediation plan:`);
    backendAudit.unapproved.forEach(u => console.error(`  - [backend] ${u.package} (${u.severity})`));
    frontendAudit.unapproved.forEach(u => console.error(`  - [frontend] ${u.package} (${u.severity})`));
    process.exit(1);
  }

  console.log('\n✅ PASS: 100% of critical and high production dependency findings have an approved remediation path.');
  process.exit(0);
}

main();
