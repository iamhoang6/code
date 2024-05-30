const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const settingSchema = new mongoose.Schema({
    auto: Boolean,
    title: String,
    timePerRound: Number
}, { timestamps: true })



module.exports = mongoose.model('settings', settingSchema);