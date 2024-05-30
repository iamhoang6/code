const moment = require('moment');
const userModel = require('../models/user.model');
const transactionModel = require('../models/transactions.model');
const Joi = require('joi')
const bcrypt = require('bcrypt');
const settingsModel = require('../models/settings.model');

const homeController = {
    home: async (req, res, next) => {

        try {

            let setting = await settingsModel.findOne({})

            let checkLatest = await transactionModel.findOne({
                status: "pending"
            }, {}, { sort: { _id: -1 } })

            res.render('admin/home', {
                checkLatest, setting
            });
        } catch (err) {
            next(err);
        }


    },

    users: async (req, res, next) => {
        
        try {

            let users = await userModel.find({})

            res.render('admin/users', {
                users
            });
        } catch (err) {
            next(err);
        }

    },

    user: async (req, res, next) => {
        
        try {

            let userInfo = await userModel.findById(req?.params?.id)

            res.render('admin/user', {
                userInfo
            });
        } catch (err) {
            next(err);
        }

    },

    editUser: async (req, res, next) => {

        try {

            let password

            if (req?.body?.password) {
                password = await bcrypt.hash(req?.body?.password, 10)
            }

            let update = await userModel.findByIdAndUpdate(req?.params?.id, {
                ...req.body,
                dateEnd: new Date(req?.body?.dateEnd),
                password: (req?.body?.password) ?? password,
                isEmailVerified: (req?.body?.isEmailVerified === "Yes") ? true : false
            })

            if (update) {

                return res.json({
                    success: true,
                    message: "Thành công"
                })

            } else {

                return res.json({
                    success: false,
                    message: "Thất bại"
                })

            }

        } catch (err) {
            next(err)
        }

    },

    deleteUser: async (req, res, next) => {
        
        let deleteA = await userModel.findByIdAndDelete(req.params.id)

        if (deleteA) {

            return res.json({
                success: true,
                message: "Thành công"
            })

        } else {

            return res.json({
                success: false,
                message: "Thất bại"
            })

        }

    },

    setting: async (req, res, next) => {
        
        let update = await settingsModel.findOneAndUpdate({}, {
            
            ...req.body,
            auto: (req?.body?.auto === "Có") ? true : false,
        })

        if (update) {

            return res.json({
                success: true,
                message: "Thành công"
            })

        } else {

            return res.json({
                success: false,
                message: "Thất bại"
            })

        }

    },

    transactions: async (req, res, next) => {

        let setting = await settingsModel.findOne({})
        
        let getLatest = await transactionModel.find({}).sort({ _id: -1 }).limit(20)

        res.render('admin/transactions', {
            getLatest, setting
        });

    },

    setNextTransaction: async (req, res, next) => {

        let checkLatest = await transactionModel.findOne({
            status: "pending"
        }, {}, { sort: { _id: -1 } })

        let update = await transactionModel.findOneAndUpdate({
            _id: checkLatest?._id
        }, {
            result: req.params.result
        })

        if (update) {

            return res.json({
                success: true,
                message: "Thành công"
            })

        } else {

            return res.json({
                success: false,
                message: "Thất bại"
            })

        }

    }

}

module.exports = homeController;