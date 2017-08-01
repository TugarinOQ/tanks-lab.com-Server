const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    factory: {
        type: Object,
        required: true
    },
    payDate: {
        type: Date,
        required: true
    }
});

BusinessSchema.pre('save', (callback) => {
    return callback();
});

module.exports = { Schema: mongoose.model('Business', BusinessSchema) };