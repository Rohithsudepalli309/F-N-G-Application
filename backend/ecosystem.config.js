// PM2 cluster config — runs one worker per CPU core.
// Set WEB_CONCURRENCY env var to override (e.g. WEB_CONCURRENCY=2 for small VMs).
module.exports = {
  apps: [
    {
      name: 'fng-backend',
      script: 'dist/server.js',
      instances: process.env.WEB_CONCURRENCY ?? 'max',
      exec_mode: 'cluster',
      // Restart a worker if it exceeds 512 MB RAM (memory leak guard).
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
