const express = require('express');
const router = express.Router();
const { getHomePageData } = require('../controllers/homepage.controller');

// Public routes
router.get('/', getHomePageData);

module.exports = router;
