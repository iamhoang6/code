const moment = require('moment');
const userModel = require("../models/user.model")
const authService = require("../service/auth.service")
const nodemailer = require('nodemailer');
const Joi = require('joi')
const bcrypt = require("bcrypt")

const authController = {


    login: async (req, res, next) => {


        try {
            res.render('auth/login');
        } catch (err) {
            next(err);
        }

    },

    register: async (req, res, next) => {


        try {
            res.render('auth/register');
        } catch (err) {
            next(err);
        }

    },

    verify: async (req, res, next) => {


        try {
            res.render('auth/verify-email');
        } catch (err) {
            next(err);
        }

    },

    resendCode: async (req, res, next) => {

        let userInfo = res.locals.profile

        // Create a transporter object using SMTP transport
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // your domain email address
                pass: process.env.SMTP_PASS // your password
            }
        });

        

        const mailOptions = {
            from: '"Bí Mật Triệu Đô" <'+process.env.SMTP_MAIL+'>',
            to: userInfo?.email,
            subject: 'Hoàn tất đăng ký của bạn',
            html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Hoàn tất đăng ký của bạn</title>
            </head>
            <body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
                <tbody>
                  <tr>
                    <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
                      <table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
                        <tbody>
                          <tr>
                            <td style="padding: 40px 0px 0px;">
                              <div style="text-align: left;">
                                <div style="padding-bottom: 20px;"><img src="https://s3.ap-northeast-1.amazonaws.com/h.files/images/1716563467130_2h1zBmDgd5.png" alt="Bí mật triệu dô" style="width: 56px;"></div>
                              </div>
                              <div style="padding: 20px; background-color: rgb(255, 255, 255);">
                                <div style="color: rgb(0, 0, 0); text-align: left;">
                                  <h1 style="margin: 1rem 0">Mã xác thực</h1>
                                  <p style="padding-bottom: 16px">Hãy nhập mã code này để hoàn tất đăng ký.</p>
                                  <p style="padding-bottom: 16px"><strong style="font-size: 130%">${userInfo?.otp}</strong></p>
                                  <p style="padding-bottom: 16px">Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua.</p>
                                  <p style="padding-bottom: 16px">Thanks,<br>Bí mật triệu đô</p>
                                </div>
                              </div>
                              <div style="padding-top: 20px; color: rgb(153, 153, 153); text-align: center;">
                                <p style="padding-bottom: 16px">Made with ♥ by BiMatTrieuDo</p>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </body>
            </html>`,
          };
        
          try {
            let sendMail = await transporter.sendMail(mailOptions);

            console.log(sendMail)

            
          } catch (error) {

            console.log(error)

          }

          return res.redirect("/auth/verify-email");

    },

    verifyEmail: async (req, res, next) => {

        let schema = Joi.object({
            otp: Joi.number().required(),
        })
        
        let validatee = schema.validate(req.body, { abortEarly: true });

        if (validatee.error) {

            return res.json({ success: false, message: validatee.error.details[0].message });

        }

        const { otp } = req.body;

        let user = await userModel.findOne({
            otp,
            _id: res.locals.profile._id
        })

        if (user) {

            await userModel.findOneAndUpdate({
                otp,
                _id: res.locals.profile._id
            }, {
                isEmailVerified: true,
                status: "freeTrial",
                dateEnd: moment().add(1, 'days').toDate()
            })
    

            return res.json({ success: true, message: "Thành công" });
        } else {
            return res.json({ success: false, message: "Mã OTP không hợp lệ" });
        }

    },

    performLogin: async (req, res, next) => {

        let schema = Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required(),
        })
        
        let validatee = schema.validate(req.body, { abortEarly: true });

        if (validatee.error) {

            return res.json({ success: false, message: validatee.error.details[0].message });

        }

        const { username, password } = req.body;

        let validate = await userModel.validate({ username });

        if (validate?.error) {

            return res.json({ success: false, message: validate.error.details[0].message });

        }

        let checkLogin = await authService.login("username", username, password, req.ip, (req.body?.remember) ? true : false)

        if (checkLogin.success) {
            return res.cookie('authToken', checkLogin.data.access_token).json(checkLogin)
        }else{
            return res.json(checkLogin)
        }


    },


    performRegister: async (req, res, next) => {

        let schema = Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required(),
            email: Joi.string().email().required(),
            "re-password": Joi.any().equal(Joi.ref('password'))
            .required()
            .label('Nhập lại mật khẩu')
            .messages({ 'any.only': '{{#label}} không đúng' }),
            bietDanhSan: Joi.string().required(),
            hasAgreed: Joi.string().required()
        })
        
        let validatee = schema.validate(req.body, { abortEarly: true });

        if (validatee.error) {

            return res.json({ success: false, message: validatee.error.details[0].message });

        }

        const { username, password, email, bietDanhSan } = req.body;

        let validate = await userModel.validate({ username });

        if (validate?.error) {

            return res.json({ success: false, message: validate.error.details[0].message });

        }

        let checkLogin = await authService.register(username, password, email, bietDanhSan, req.ip, true)

        if (checkLogin.success) {
            return res.cookie('authToken', checkLogin.data.access_token).json(checkLogin)
        }else{
            return res.json(checkLogin)
        }


    },

    performPasswordChange: async (req, res, next) => {

        let schema = Joi.object({
            newPassword: Joi.string().required(),
            reNewPassword: Joi.any().equal(Joi.ref('newPassword'))
            .required()
            .label('Nhập lại mật khẩu')
            .messages({ 'any.only': '{{#label}} không đúng' }),
            oldPassword: Joi.string().required(),
        })
        
        let validatee = schema.validate(req.body, { abortEarly: true });

        if (validatee.error) {

            return res.json({ success: false, message: validatee.error.details[0].message });

        }

        const { newPassword, reNewPassword, oldPassword } = req.body;

        let user = await userModel.findOne({
            _id: res.locals.profile._id
        })

        const isMatch = await user.comparePassword(oldPassword);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Mật khẩu cũ không đúng"
            })
        }

        await userModel.findOneAndUpdate({
            _id: res.locals.profile._id
        }, {
            password: await bcrypt.hash(newPassword, 10),
            tokenLogin: ""
        })
        
        return res.json({
            success: true,
            message: "Thành công"
        })

    },

    logout: async (req, res, next) => {

        return res.clearCookie('authToken').redirect(`/auth/login`);

    },

    changeBietDanh: async (req, res, next) => {

        let user = res.locals.profile

        await userModel.findOneAndUpdate({
            _id: user._id
        }, {
            bietDanhSan: req?.body?.bietDanhSan
        })

        return res.json({
            success: true,
            message: "Thành công"
        })

    }

}

module.exports = authController;