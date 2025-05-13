const { Pool } = require("pg");
require("dotenv").config(); // Load DB credentials from .env file

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

module.exports = pool; // Export the pool to use it in other files
