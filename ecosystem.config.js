module.exports = {
  apps: [{
    name: 'skillsprint',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/skillsprint',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    env_file: '.env.production',
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs'],
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
