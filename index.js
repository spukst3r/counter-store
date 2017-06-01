const _ = require('lodash');
const { promisify } = require('util');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const yaml = require('js-yaml');

const loggerMiddleware = require('./app/middleware/logger');
const logger = require('./app/logger');

const pollRoute = require('./app/routes/poll');

const readFile = promisify(fs.readFile);

const app = express();


app.use(bodyParser.json());
app.use(loggerMiddleware);
app.use(pollRoute.router);


async function init(path) {
  const content = await readFile(path);
  const config = yaml.safeLoad(content);

  app.set('config', config);
  app.set('counters', _(config.languages)
    .map((v, k) => ({ id: parseInt(k, 10), lang: v, rank: 0 }))
    .value());

  if (process.env.NODE_ENV === 'production') {
    logger.info('Started server');
    app.listen(config.socket);
  } else {
    logger.info('Started server, listening on port 3000');
    app.listen(3000);
  }
}


init('config.yml')
  .catch(err => logger.error(err));
