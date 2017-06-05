const _ = require('lodash');
const logger = require('../logger');


module.exports = function existingEmail(app) {
  return _.throttle(async (email) => {
    const db = app.get('db');
    const users = db.collection('users');

    let user;

    try {
      user = await users.findOne({ email }, {});
    } catch (e) {
      logger.error(e);

      throw e;
    }

    if (!user) {
      throw new Error('Unknown email');
    }
  }, 5 * 60 * 1000);
};
