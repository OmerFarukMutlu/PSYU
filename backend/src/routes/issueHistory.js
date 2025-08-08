const express = require('express');
const router = express.Router({ mergeParams: true });
const verifyToken = require('../middlewares/authMiddleware');
const issueHistoryController = require('../controllers/issueHistoryController');

router.get('/', verifyToken, issueHistoryController.getHistory);

module.exports = router;
