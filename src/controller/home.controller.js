const moment = require('moment');
const userModel = require('../models/user.model');
const transactionModel = require('../models/transactions.model');
const Joi = require('joi')

const homeController = {
    home: async (req, res, next) => {
        try {

            res.render('home', {

            });
        } catch (err) {
            next(err);
        }


    },

    getCurrent: async (req, res, next) => {
        try {

            let checkOk = (req?.query?.ok) ? eval(req?.query?.ok) : "ok"

            if (res.locals.profile?.dateEnd < moment()) {
                return res.json({
                    success: false,
                    result: "Bạn đã hết hạn mức sử dụng !"
                })
            }

            let checkLatest = await transactionModel.findOne({
                status: "providedToUser"
            }, {}, { sort: { _id: -1 } })

            

            return res.json({
                success: true,
                result: checkLatest?.result,
                randPercent: checkLatest?.randPercent,
                timeDiff: Math.floor((Date.parse(checkLatest?.dateEnd) - Date.now()) / 1000)
            })

        } catch (err) {
            next(err);
        }


    },

    dashboard: async (req, res, next) => {
        try {

            res.render('dashboard', {

            });
        } catch (err) {
            next(err);
        }


    },

    landing: async (req, res, next) => {


        return res.render("landing")
    }

}

module.exports = homeController;