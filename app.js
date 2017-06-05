const _ = require('lodash');
const { URL } = require('url');
const { promisify } = require('util');
const { MongoClient, ReadPreference } = require('mongodb');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const validator = require('express-validator');
const yaml = require('js-yaml');

const loggerMiddleware = require('./app/middleware/logger');
const corsMiddleware = require('./app/middleware/cors');
const noDelayMiddleware = require('./app/middleware/noDelay');

const pollRoute = require('./app/routes/poll');
const registerRoute = require('./app/routes/register');
const healthCheckRoute = require('./app/routes/healthcheck');
const userstatsRoute = require('./app/routes/userstats');

const uniqueEmailValidator = require('./app/validators/uniqueEmail');
const existingEmailValidator = require('./app/validators/existingEmail');
const validLanguageValidator = require('./app/validators/validLanguage');

const Lock = require('./app/utils/lock');
const setTimers = require('./app/utils/periodic');

const readFile = promisify(fs.readFile);

const app = express();


app.use(noDelayMiddleware);
app.use(bodyParser.json());
app.use(validator({
  customValidators: {
    uniqueEmail: uniqueEmailValidator(app),
    existingEmail: existingEmailValidator(app),
    validLanguage: validLanguageValidator(app),
  },
}));

if (process.env.NODE_ENV !== 'production') {
  app.use(loggerMiddleware);
}

app.use(corsMiddleware);
app.use(pollRoute.router);
app.use(registerRoute.router);
app.use(healthCheckRoute.router);
app.use(userstatsRoute.router);


async function initDb(config) {
  const db = config.db;
  const connectionString = new URL(`mongodb://${db.host}/${db.name}`);

  if (db.replicaSet) {
    connectionString.searchParams.append('replicaSet', db.replicaSet);
  }

  const connection = await MongoClient.connect(connectionString.toString(), {
    readPreference: ReadPreference.SECONDARY_PREFERRED,
  });

  const cache = connection.collection('cache');

  await cache.createIndex({
    expireAt: 1,
  }, {
    expireAfterSeconds: 0,
  });

  return connection;
}


module.exports = async function createApp(path) {
  const content = await readFile(path);
  const config = yaml.safeLoad(content);
  const db = await initDb(config);
  let gc = _.noop;

  if (typeof global.gc !== 'undefined') {
    gc = global.gc;
  }

  app.set('config', config);
  app.set('db', db);
  app.set('users', {});
  app.set('lock', new Lock());
  app.set('languages', _(config.languages)
    .map((v, k) => ({ id: parseInt(k, 10), count: 0 }))
    .sortBy(['id'])
    .value());
  app.set('gc', gc);

  setTimers(app);

  return app;
};
