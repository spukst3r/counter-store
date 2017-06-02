const _ = require('lodash');


module.exports = function validLanguage(app) {
  return (id) => {
    const languages = app.get('languages');

    return !_(languages)
      .filter({ id })
      .isEmpty();
  };
};
