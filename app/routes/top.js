const _ = require('lodash');
const cached = require('../utils/cached');
const express = require('express');

const router = express.Router();


const url = '/api/v1/top';

const getTopUsers = cached('topUsers', async (db) => {
  const users = db.collection('users');

  const result = await users.aggregate([
    {
      $unwind: {
        path: '$votes',
      },
    }, {
      $group: {
        _id: '$email',
        count: {
          $sum: '$votes.count',
        },
      },
    }, {
      $sort: {
        count: -1,
      },
    }, {
      $limit: 5,
    },
  ]);

  return result.toArray();
}, 60);


router.get(url, async (req, res) => {
  const result = {
    top: _.map(await getTopUsers('full', req.app.get('db')), user => ({
      email: `${user._id.split('@')[0]}@...`,
      count: user.count,
    })),
  };

  return res.status(200).json(result);
});


module.exports = {
  url,
  router,
};
