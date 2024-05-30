const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: String,
    bietDanhSan: String,
    email: String,
    password: String,
    role: String,
    status: String,
    otp: Number,
    isEmailVerified: Boolean,
    ip: String,
    tokenLogin: String,
    lastLogin: Date,
    dateEnd: Date
}, { timestamps: true })


userSchema.statics.validate = function(obj) {
	var Joi = require('joi');
	var schema = Joi.object({
		email: Joi.string().email(),
		username: Joi.string(),
        bietDanhSan: Joi.string(),
	})
	return schema.validate(obj, { abortEarly: true });
}

userSchema.methods.comparePassword = function(password) {
	
    return bcrypt.compare(password, this.password)

}

module.exports = mongoose.model('user', userSchema);