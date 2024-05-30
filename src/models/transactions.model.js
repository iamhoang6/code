const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const transactionSchema = new mongoose.Schema({
    shortId: String,
    result: String,
    auto: Boolean,
    status: String,
    dateEnd: Date,
    dateStart: Date
}, { timestamps: true })



module.exports = mongoose.model('transactions', transactionSchema);