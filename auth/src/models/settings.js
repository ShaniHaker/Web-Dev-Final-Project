const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
    {
        candidateRadiusKm: {
            type: Number,
            required: true,
            default: 5
        },

        arrivalThresholdMeters: {
            type: Number,
            required: true,
            default: 50
        },

        lowBatteryThreshold: {
            type: Number,
            required: true,
            default: 20
        }
    },
    {
        timestamps: true
    }
);

const Settings =mongoose.model('Settings', settingsSchema);

module.exports = Settings;