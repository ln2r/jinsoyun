module.exports = {
  apps : [{
    name: 'Jinsoyun',
    script: 'index.js',

    // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    instances: 1,
    autorestart: true,
    watch: true,
    max_memory_restart: '1G',
  }]
};
