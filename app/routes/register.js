const express = require('express');

const router = express.Router();


const url = '/api/v1/register';


router.post(url, async (req, res) => {
  req.checkBody('email', 'Invalid email')
    .notEmpty()
      .withMessage('Email is required')
    .isEmail()
    .uniqueEmail()
      .withMessage('This email is already registered');

  req.checkBody('name', 'Invalid name')
    .notEmpty()
      .withMessage('Name is required')
    .matches(/^[a-zа-я][a-zа-я0-9- ]*$/i);

  req.sanitizeBody('name').toString();

  const errors = await req.getValidationResult();

  errors.useFirstErrorOnly();

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array(),
    });
  }

  const db = req.app.get('db');
  const users = db.collection('users');

  await users.insertOne({
    email: req.body.email,
    name: req.body.name,
    votes: req.app.get('languages'),
  });

  return res.status(201).json({});
});


module.exports = {
  url,
  router,
};
