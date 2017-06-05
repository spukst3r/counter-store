const _ = require('lodash');
const logger = require('../logger');
const randomInt = require('./random');


function setTimers(app) {
  const cacheSettings = _.get(app.get('config'), 'cache', {});

  async function saveToDb() {
    const db = app.get('db');

    logger.info(`Flushing cache for ${_.keys(app.get('users')).length} users`);

    await app.get('lock').acquire(async () => {
      const users = db.collection('users');
      const operations = _.map(app.get('users'), (counters, email) => ({
        updateOne: {
          filter: { email },
          update: {
            $inc: _(counters)
              .map((count, languageId) => [`votes.${languageId}.count`, count])
              .fromPairs()
              .value(),
          },
        },
      }));

      if (_.isEmpty(operations)) {
        return;
      }

      try {
        await users.bulkWrite(operations, {
          ordered: false,
        });
      } catch (e) {
        logger.error(`bulkWrite failed: ${e}`);
      }

      app.set('users', {});
      app.get('gc')();
    });
  }

  function interval() {
    setTimeout(saveToDb, randomInt(
      _.get(cacheSettings, 'workerRandomDelay.min', 1000),
      _.get(cacheSettings, 'workerRandomDelay.max', 10000),
    ));
  }

  setInterval(interval, _.get(cacheSettings, 'pollDelay', 2 * 60 * 1000));

  async function flushAndExit() {
    if (!_.isEmpty(app.get('users'))) {
      await saveToDb();
    }

    process.exit(0);
  }

  process.on('SIGINT', flushAndExit);
  process.on('SIGTERM', flushAndExit);
}


module.exports = setTimers;
