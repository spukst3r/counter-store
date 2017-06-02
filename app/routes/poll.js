const _ = require('lodash');
const express = require('express');
const logger = require('../logger');

const router = express.Router();


const url = '/api/v1/poll';


const aggregateVotes = _.throttle(async (db) => {
  const users = db.collection('users');

  logger.info('Aggregating votes');

  const result = await users.aggregate([
    {
      $project: {
        votes: { $sum: '$votes.count' },
      },
    },
    {
      $group: {
        _id: null,
        votes: { $sum: '$votes' },
      },
    },
  ]);

  return _.first(await result.toArray()).votes;
}, 2 * 60 * 1000);


router.get(url, async (req, res) => {
  res.status(200).json({
    totalPollHits: await aggregateVotes(req.app.get('db')),
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

  const votes = await users.updateOne({
    email: req.body.email,
    'votes.id': req.body.language,
  }, {
    $inc: {
      'votes.$.count': 1,
    },
  });

  logger.info(`Modified count: ${votes.modifiedCount}`);

  if (votes.modifiedCount === 0) {
    await users.updateOne({
      email: req.body.email,
      'votes.id': {
        $ne: req.body.language,
      },
    }, {
      $push: {
        votes: {
          id: req.body.language,
          count: 1,
        },
      },
    });
  }

  return res.status(200).json({
    status: 'ok',
  });
});


module.exports = {
  url,
  router,
};
