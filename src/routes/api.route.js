const express = require('express');
// const apiController = require('../controller/api.controller');
const { loggedIn } = require('../middleware/auth.middleware');
const homeController = require('../controller/home.controller');
const router = express.Router();

// Api route
router.get('/getCurrent', loggedIn, homeController.getCurrent);

module.exports = router;