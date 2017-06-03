const _ = require('lodash');
const express = require('express');
const logger = require('../logger');
const cached = require('../utils/cached');

const router = express.Router();


const url = '/api/v1/poll';


const aggregateVotes = cached('aggregateVotes', async (db) => {
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
        totalVotes: { $sum: '$votes' },
      },
    },
  ]);

  return _.get(_.first(await result.toArray()), 'totalVotes', 0);
});


const statsByLang = cached('statsByLang', async (db) => {
  const users = db.collection('users');

  logger.info('Aggregating full stats');

  const result = await users.aggregate([
    {
      $unwind: {
        path: '$votes',
      },
    }, {
      $group: {
        _id: '$votes.id',
        count: {
          $sum: '$votes.count',
        },
      },
    }]);

  return _(await result.toArray())
    .map(r => [r._id, r.count])
    .fromPairs()
    .value();
});


router.get(url, async (req, res) => {
  req.checkQuery('full', 'Invalid query').optional().isBoolean();
  req.sanitizeQuery('full').toBoolean();

  const errors = await req.getValidationResult();

  errors.useFirstErrorOnly();

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.mapped(),
    });
  }

  const result = {
    totalPollHits: await aggregateVotes('partial', req.app.get('db')),
  };

  if (req.query.full) {
    result.votes = await statsByLang('full', req.app.get('db'));
  }

  return res.status(200).json(result);
});


router.post(url, async (req, res) => {
  req.checkBody('email', 'Invalid email')
    .notEmpty()
      .withMessage('Email is required')
    .isEmail()
    .existingEmail()
      .withMessage('This email is not registered');

  req.checkBody('language', 'Invalid language')
    .isInt()
    .validLanguage()
      .withMessage('Unknown language');

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
