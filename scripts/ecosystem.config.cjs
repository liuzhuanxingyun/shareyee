module.exports = {
  apps: [
    {
      name: 'shareyee',
      script: './src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      exp_backoff_restart_delay: 100,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
