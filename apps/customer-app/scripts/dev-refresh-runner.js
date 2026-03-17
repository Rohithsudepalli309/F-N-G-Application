const { spawnSync } = require('child_process');

const result = spawnSync('cmd.exe', ['/c', 'scripts\\dev-refresh.cmd'], {
  stdio: 'inherit',
  shell: false,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
