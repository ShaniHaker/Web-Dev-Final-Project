/*
ONE TIME USE ONLY --> used for inserting admin user.
*/
require('dotenv').config();

const bcrypt = require('bcrypt');
const connectDB = require('./db');
const Admin = require('./models/admin');

async function insertAdmin() {
    try {
        await connectDB();

        const passwordHash = await bcrypt.hash('1234', 10);

        await Admin.create({username: 'micha', password_hash: passwordHash, role: 'admin'});
        console.log('Admin created successfully');
        process.exit(0);
    }
    catch(error) {
        console.error('Failed to insert admin:', error);
        process.exit(1);
    }
}

insertAdmin();