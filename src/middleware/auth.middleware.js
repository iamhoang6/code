"use strict"
const userModel = require('../models/user.model');
const authService = require('../service/auth.service');

exports.loggedIn = async (req, res, next) => {
    try {

        if (!req.cookies?.['authToken']) return res.redirect(`/auth/login`);

        let token = req.cookies['authToken'];

        let user = await authService.checkAuth(token);

        if (!user.infoUser) throw new Error('User not found!');
        if (user.isEmailVerified === false && req.originalUrl !== '/auth/verify-email' && req.originalUrl !== '/auth/logout') return res.redirect(`/auth/verify-email`);
        
        res.locals.profile = user.infoUser;



        next();

    } catch (err) {

        return res.clearCookie('authToken').redirect(`/auth/login`);
        
    }
}

exports.isAuth = async (req, res, next) => {
    try {
        if (!req.cookies?.['authToken']) return next();

        let token = req.cookies['authToken'];


        let user = await authService.checkAuth(token);
        
        if (!user.infoUser) throw new Error('User not found!');

        if (user.infoUser.isEmailVerified === false && req.originalUrl !== '/auth/verify-email' && req.originalUrl !== '/auth/logout') return res.redirect(`/auth/verify-email`);
    
        res.locals.profile = user.infoUser;
        res.redirect(`/home`);
    } catch (err) {
        res.clearCookie('authToken');
        return next();
    }
}

exports.isAdmin = async (req, res, next) => {
    try {

        if (!req.cookies?.['authToken']) return res.redirect(`/auth/login`);

        let token = req.cookies['authToken'];

        let user = await authService.checkAuth(token);

        if (!user.infoUser) throw new Error('User not found!');
        if (user.infoUser.isEmailVerified === false && req.originalUrl !== '/auth/verify-email' && req.originalUrl !== '/auth/logout') return res.redirect(`/auth/verify-email`);
        
        res.locals.profile = user.infoUser;

        if (user.infoUser.role === "admin") {
            next();
        } else {
            return res.redirect("/")
        }

        

    } catch (err) {

        return res.clearCookie('authToken').redirect(`/auth/login`);
        
    }
}
