const express = require('express');

//Routes
const authRoute = require('./auth.route')
const homeRoute = require('./home.route')
const apiRoute = require('./api.route')
const adminRoute = require('./admin.route')
const router = express.Router();

//authRoutes
router.use('/auth', authRoute)
router.use('/', homeRoute)
router.use('/api', apiRoute)
router.use('/admin', adminRoute)


module.exports = router;