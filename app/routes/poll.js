const express = require('express');

const router = express.Router();


const url = '/api/v1/poll';


router.get(url, async (req, res) => {
  res.status(200).json({
    totalPollHits: 123,
  });
});


router.post(url, async (req, res) => {
  req.checkBody('email', 'Invalid email').notEmpty().isEmail().existingEmail();
  req.checkBody('language', 'Invalid language').isInt().validLanguage();

  const errors = await req.getValidationResult();

  errors.useFirstErrorOnly();

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array(),
    });
  }

  const users = req.app.get('db').collection('users');

  req.sanitizeBody('language').toInt();

  await users.updateOne({
    email: req.body.email,
    'votes.id': {
      $ne: req.body.language,
    },
  }, {
    $push: {
      votes: {
        id: req.body.language,
        count: 0,
      },
    },
  });

  await users.updateOne({
    email: req.body.email,
    'votes.id': req.body.language,
  }, {
    $inc: {
      'votes.$.count': 1,
    },
  });

  return res.status(200).json({
    status: 'ok',
  });
});


module.exports = {
  url,
  router,
};
