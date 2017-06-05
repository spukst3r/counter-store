const express = require('express');
const cached = require('../utils/cached');

const router = express.Router();


const url = '/api/v1/userstats';


const aggregateUsers = cached('aggregateUsers', async (db) => {
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
      $limit: 3,
    }, {
      $project: {
        _id: 0,
        email: '$_id',
        count: 1,
      },
    },
  ]);

  return result.toArray();
});


router.get(url, async (req, res) => {
  const result = {
    userStats: await aggregateUsers('partial', req.app.get('db')),
  };

  return res.status(200).json(result);
});


module.exports = {
  url,
  router,
};

