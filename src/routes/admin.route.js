const express = require('express');
const adminController = require('../controller/admin.controller');
const { isAdmin } = require('../middleware/auth.middleware');
const router = express.Router();

/* 

    Routes Home

*/

// Admin home

router.get('/', isAdmin, adminController.home);
router.get('/transactions', isAdmin, adminController.transactions);
router.get('/users', isAdmin, adminController.users);
router.get('/user/:id', isAdmin, adminController.user);
router.post('/user/:id', isAdmin, adminController.editUser);
router.get('/user/:id/delete', isAdmin, adminController.deleteUser);
router.get('/setNextTransaction/:result', isAdmin, adminController.setNextTransaction);
router.post('/setting', isAdmin, adminController.setting);

module.exports = router;