const express = require('express');

const router = express.Router();


const url = '/api/v1/poll';


router.get(url, async (req, res) => {
  res.status(200).json({
    totalPollHits: 123,
  });
});


module.exports = {
  url,
  router,
};
