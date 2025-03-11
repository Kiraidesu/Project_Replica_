const { Client } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// PostgreSQL Connection Setup for Initial DB Check
const rootClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// PostgreSQL Connection for Working with the Database
const dbClient = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// SQL queries to check and create the database
const checkDatabaseQuery = `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`;
const createDatabaseQuery = `CREATE DATABASE ${process.env.DB_NAME}`;

// Queries to check and create tables
const createProductsTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image TEXT NOT NULL
    );
`;

const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user'
    );
`;

async function setupDatabase() {
    try {
        // Connect to PostgreSQL without specifying a database
        await rootClient.connect();
        console.log("✅ Connected to PostgreSQL (Root Client)");

        // Check if the database exists
        const result = await rootClient.query(checkDatabaseQuery);
        if (result.rowCount === 0) {
            console.log(`🔹 Database "${process.env.DB_NAME}" not found. Creating...`);
            await rootClient.query(createDatabaseQuery);
            console.log(`✅ Database "${process.env.DB_NAME}" created successfully.`);
        } else {
            console.log(`✅ Database "${process.env.DB_NAME}" already exists.`);
        }
        await rootClient.end();

        // Connect to the actual database
        await dbClient.connect();
        console.log(`✅ Connected to Database: ${process.env.DB_NAME}`);

        // Create the tables if they don’t exist
        await dbClient.query(createProductsTableQuery);
        console.log("✅ Products table is ready.");
        
        await dbClient.query(createUsersTableQuery);
        console.log("✅ Users table is ready.");

        await dbClient.end();
        console.log("🎉 Database setup complete.");
    } catch (error) {
        console.error("❌ Error setting up database:", error);
        process.exit(1);
    }
}

// Run the setup
setupDatabase();
