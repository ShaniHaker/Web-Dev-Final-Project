const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset:'utf8mb4',
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10
});

// exporting for future use in other files
module.exports = pool;