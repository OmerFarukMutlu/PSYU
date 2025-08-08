const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');

router.get('/secret', verifyToken, (req, res) => {
  res.json({ message: `Hoş geldin, kullanıcı ID: ${req.user.id}` });
});

module.exports = router;
