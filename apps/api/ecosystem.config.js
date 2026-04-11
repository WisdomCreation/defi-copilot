// PM2 will automatically load .env file from the working directory
module.exports = {
  apps: [{
    name: 'defi-api',
    script: 'src/index.ts',
    interpreter: 'tsx',
    cwd: '/root/defi-copilot/apps/api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/.pm2/logs/defi-api-error.log',
    out_file: '/root/.pm2/logs/defi-api-out.log',
    log_file: '/root/.pm2/logs/defi-api-combined.log',
    time: true,
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
