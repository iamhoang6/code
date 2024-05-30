const express = require('express');
const homeController = require('../controller/home.controller');
const { loggedIn, isAuth } = require('../middleware/auth.middleware');
const router = express.Router();

/* 

    Routes Home

*/

// Admin home

router.get('/', isAuth, homeController.landing);    
router.get('/', loggedIn, homeController.dashboard);
router.get('/home', loggedIn, homeController.dashboard);
router.get('/access/openAI', loggedIn, homeController.home);



module.exports = router;