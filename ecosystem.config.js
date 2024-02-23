module.exports = {
  apps : [{
    name: "jake",
    script: 'index.js',
    watch: '.'
  // }, {
  //   script: './service-worker/',
  //   watch: ['./service-worker']
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      max_restarts : 5,
      min_uptime : 30,
      restart_delay: 5000,
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
