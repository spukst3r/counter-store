const _ = require('lodash');
const os = require('os');
const createApp = require('./app');
const logger = require('./app/logger');
const cluster = require('cluster');


let configName = 'config/development.yml';

if (process.env.NODE_ENV === 'production') {
  configName = 'config/production.yml';
}


async function run() {
  const app = await createApp(configName);
  const cpus = os.cpus().length;
  const config = app.get('config');
  const backlog = _.get(config, 'listen.backlog', 512);

  if (cluster.isMaster) {
    logger.info('Started master process');

    _.times(cpus, () => cluster.fork());
  } else if (_.get(config, 'listen.port')) {
    logger.info(`Worker: Listening on port ${config.listen.port}`);

    app.listen(config.listen.port, backlog);
  } else if (_.get(config, 'listen.path')) {
    logger.info(`Worker: Creating UNIX socket ${config.listen.path}`);

    app.listen(config.listen.path, backlog);
  } else {
    logger.error('Please specify \'listen\' section in the config file');
  }
}


run()
  .catch(err => logger.error(err));
