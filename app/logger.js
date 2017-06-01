const _ = require('lodash');
const winston = require('winston');


const transport = new (winston.transports.Console)({
  timestamp() {
    return (new Date()).toJSON();
  },
  formatter(log) {
    let meta = '';

    if (!_.isEmpty(log.meta)) {
      meta = `\n  ${JSON.stringify(log.meta)}`;
    }

    const message = winston.config.colorize(log.level, `[${log.level}] ${log.message}`);

    return `[${log.timestamp()}] ${message}${meta}`;
  },
});

const logger = new winston.Logger({
  level: 'debug',
  transports: [
    transport,
  ],
});


module.exports = logger;
