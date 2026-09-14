module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'refactor', 'perf', 'style', 'docs', 'chore', 'test', 'build',
      'revert', 'db', 'dna', 'api'
    ]],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
    'scope-enum': [2, 'always', [
      'master','finance','scm','rnd','production','warehouse','qc','busdev','creative','legality','hr','executive','system',
      'code-engine','audit','outbox','rbac','error','envelope','idempotency',
      'frontend','backend','infra','ci'
    ]],
    'scope-empty': [1, 'never'],
  }
};
