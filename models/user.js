const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const userSchema = new Schema({
    fullName: String,
    email: String,
    mobileNumber: Number,
    password: String
});

module.exports = mongoose.model('user', userSchema,'users');
