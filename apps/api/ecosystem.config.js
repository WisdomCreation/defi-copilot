module.exports = {
  apps: [{
    name: 'defi-api',
    script: 'src/index.ts',
    interpreter: 'tsx',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://defi_user:defi_secure_2024@localhost:5432/defi_copilot?schema=public',
      PORT: '3001'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/.pm2/logs/defi-api-error.log',
    out_file: '/root/.pm2/logs/defi-api-out.log',
    log_file: '/root/.pm2/logs/defi-api-combined.log',
    time: true
  }]
};
