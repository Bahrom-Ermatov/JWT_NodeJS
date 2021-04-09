const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    guid: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    creDate: {
        type: Date,
        default: Date.now
    },
    expDate: {
        type: Date
    },
    tokenUsed: {
        type: Boolean
    }
});

module.exports = mongoose.model('User', userSchema);

