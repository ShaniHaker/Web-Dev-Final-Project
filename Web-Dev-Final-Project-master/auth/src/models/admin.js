
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema( 
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password_hash: {
            type: String,
            required: true
        },
        role: {
            type: String,
            default: 'admin'
        },
    },
    {
        timestamp: true
    }    
    
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;