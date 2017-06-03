const moment = require('moment');
const logger = require('../logger');


module.exports = function cached(namespace, fn, storeSec = 120) {
  return async (key, db, ...args) => {
    const cache = db.collection('cache');

    const res = await cache.findOne({ namespace, key });

    if (res) {
      logger.debug(`Found in cache: ${JSON.stringify(res.data)}`);

      return res.data;
    }

    logger.debug(`Calling undecorated function for ${namespace}:${key}`);

    logger.info(`Cache will expire in ${storeSec} seconds`);

    const data = await fn(db, ...args);

    await cache.replaceOne({ namespace, key }, {
      namespace,
      key,
      data,
      expireAt: moment
        .utc()
        .add(storeSec, 'seconds')
        .toDate(),
    }, {
      upsert: true,
    });

    return data;
  };
};
