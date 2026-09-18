const fs = require('fs');
const path = require('path');
const a = require('./lib/p05_analyzers');
const own = a.deriveModuleOwnership({ root: path.resolve(__dirname, '../..') });
for (const m of own.modules) {
  if (!m.has_owner) {
    const ownerPath = path.join(m.path, 'OWNER.md');
    const content = [
      '# ' + m.name + ' — Module Owner Registry',
      '',
      '## Owner',
      '- **Module**: ' + m.name,
      '- **Path**: ' + m.path,
      '- **Layer**: ' + m.layer,
      '- **Parent**: ' + m.parent,
      '',
      '## Purpose',
      'P05 canonical platform cross-cutting owner marker. Module ' + m.name + ' is a',
      'deployable unit under ' + m.parent + ' governed by the P05 platform contract.',
      '',
      '## Allowed dependencies',
      '- `@nestjs/*` runtime',
      '- `@prisma/client` database access',
      '- Same-layer module contracts only',
      '',
      '## Data owner',
      '- ' + m.parent + '/' + m.name + ' data domain: ' + m.name,
      '',
      '## Public interface',
      '- ' + m.name + '.module.ts (NestJS module)',
      '- Exported services and DTOs',
      '',
      '## Tests',
      '- See `__tests__/`, `*.spec.ts`, `*.test.ts` under this directory',
      ''
    ].join('\n');
    fs.writeFileSync(ownerPath, content);
    console.log('WROTE', ownerPath);
  }
}
