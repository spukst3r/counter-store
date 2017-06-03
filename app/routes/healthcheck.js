const express = require('express');

const router = express.Router();


const url = '/api/v1/healthcheck';


router.get(url, async (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});


module.exports = {
  url,
  router,
};
