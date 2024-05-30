const moment = require('moment');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/user.model');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const authService = {

    login: async (credType, usernameOrEmail, password, ip, remember = true) => {
        try {


            const user = (credType === "email") ? await userModel.findOne({ email: usernameOrEmail }) : await userModel.findOne({ username: usernameOrEmail })

            if (!user) {
                return ({
                    success: false,
                    message: 'Tài khoản hoặc mật khẩu không đúng !'
                })
            }

            const isMatch = await user.comparePassword(password);

            if (isMatch) {

                let tokenLogin = uuidv4();

                const token = JWT.sign({ _id: user._id, username: user.username, token: tokenLogin, ip }, process.env.JWT_SECRET, {
                    expiresIn: "30d"
                });
    
                
                await userModel.findOneAndUpdate({ _id: user._id }, { $set: { tokenLogin, ip, lastLogin: moment().toDate() } })
    
                return ({
                    success: true,
                    message: 'Xin chào '+ ((user.hasOwnProperty('name')) ? user.name : user.username) +" !",
                    data: {
                        access_token: token,
                        expiresIn: moment().add(1, 'months').calendar()
                    }
                })


            }
            


            return ({
                success: false,
                message: 'Tài khoản hoặc mật khẩu không đúng !'
            })


        } catch (err) {
            console.log(err);
            return ({
                success: false,
                message: `Có lỗi xảy ra !`
            })
        }
    },
    
    register: async (username, password, email, bietDanhSan, ip, remember = true) => {
        try {


            const user = await userModel.findOne({ $or: [
                {
                    email
                },
                {
                    username
                },
                {
                    bietDanhSan
                }
            ] })

            if (user) {
                return ({
                    success: false,
                    message: 'Tài khoản đã tồn tại !'
                })
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            let otp = crypto.randomInt(100000, 999999).toString();

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
                from: '"BiMatTrieuDo" <'+process.env.SMTP_MAIL+'>',
                to: email,
                subject: 'Hoàn tất đăng ký của bạn',
                html: `
                  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
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
                                      <div style="padding-bottom: 20px;"><img src="https://s3.ap-northeast-1.amazonaws.com/h.files/images/1716563467130_2h1zBmDgd5.png" alt="Company" style="width: 56px;"></div>
                                    </div>
                                    <div style="padding: 20px; background-color: rgb(255, 255, 255);">
                                      <div style="color: rgb(0, 0, 0); text-align: left;">
                                        <h1 style="margin: 1rem 0">Mã xác thực</h1>
                                        <p style="padding-bottom: 16px">Hãy nhập mã code này để hoàn tất đăng ký.</p>
                                        <p style="padding-bottom: 16px"><strong style="font-size: 130%">${otp}</strong></p>
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
                  </html>
                `,
              };
            
              try {
                let sendMail = await transporter.sendMail(mailOptions);

                console.log(sendMail)

                
              } catch (error) {

                // return ({
                //     success: false,
                //     message: (error?.message) ? error?.message : error
                // })

                console.log(error)

              }
  

            let create = await userModel.create({
                username, email, bietDanhSan, password: hashedPassword, otp, role: "user", status: "emailVerify", isEmailVerified: false
            })

            if (create) {

                let tokenLogin = uuidv4();

                const token = JWT.sign({ _id: create._id, username: create.username, token: tokenLogin, ip }, process.env.JWT_SECRET, {
                    expiresIn: "30d"
                });
    
                
                await userModel.findOneAndUpdate({ _id: create._id }, { $set: { tokenLogin, ip, lastLogin: moment().toDate() } })
    
                return ({
                    success: true,
                    message: 'Xin chào '+ create.username +" !",
                    data: {
                        access_token: token,
                        expiresIn: moment().add(1, 'months').calendar()
                    }
                })


            }
            


            return ({
                success: false,
                message: 'Tạo tài khoản thất bại !'
            })


        } catch (err) {
            return ({
                success: false,
                message: `Có lỗi xảy ra !`
            })
        }
    },


    checkAuth: async (tokenAuth) => {
        try {

            let user = await JWT.verify(tokenAuth, process.env.JWT_SECRET);

            let infoUser = await userModel.findOne({ _id: user._id, username: user.username, tokenLogin: user.token }).lean();


            return {
                infoUser,
                securityBypass: user.isSecurityBypass
            }
            

        } catch (err) {
            console.log(err);
            return;
        }
    },


    


}

module.exports = authService;