const morgan = require('morgan');


morgan.token('body', (req) => {
  if (req.body) {
    return JSON.stringify(req.body, null, 2);
  }

  return '<empty body>';
});

morgan.format('dev-body', ':method :url :status :response-time ms - :res[content-length] - :body');


module.exports = morgan('dev-body');
