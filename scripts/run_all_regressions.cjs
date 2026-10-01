const { execSync } = require('child_process');

for (let f = 1; f <= 7; f++) {
  try {
    const res = execSync(`node scripts/test_fase_${f}_full_regression.cjs`, { encoding: 'utf8' });
    const lines = res.split('\n').filter((l) => l.includes('Passed:') || l.includes('100%'));
    console.log(`FASE ${f}: ${lines.join(' | ')}`);
  } catch (err) {
    console.error(`FASE ${f} FAILED: ${err.message}`);
  }
}
