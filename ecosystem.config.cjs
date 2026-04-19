module.exports = {
  apps: [
    {
      name: 'shareyee',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      // 日志
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自动重启
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // 崩溃延迟重启
      exp_backoff_restart_delay: 100,
      // 监听文件变化（开发用，生产建议关闭）
      watch: false,
      // 内存限制
      max_memory_restart: '500M',
    },
  ],
};
