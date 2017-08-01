const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
    title: {
        type: String,
        unicode: true,
        required: true
    },
    imgClass: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    income: {
        type: Number,
        required: true
    },
    incomePercent: {
        type: Number,
        required: true
    },
    availableShop: {
        type: Boolean,
        default: false
    }
});

BuildingSchema.pre('save', (callback) => {
    return callback();
});

module.exports = { Schema: mongoose.model('Building', BuildingSchema) };