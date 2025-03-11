const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const router = express.Router();
const dataPath = path.join(__dirname, "../data/users.json");
const SECRET_KEY = process.env.JWT_SECRET;

const USE_DATABASE = process.env.USE_DATABASE === "true";
const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        return res.status(403).json({ error: "Invalid token format." });
    }

    jwt.verify(tokenParts[1], SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user;
        next();
    });
};

// Middleware to check Admin role
const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    next();
};

// User Signup
router.post("/signup", async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ error: "Username, email, password, and role are required" });
    }

    if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Choose either 'admin' or 'user'." });
    }

    try {
        if (USE_DATABASE) {  // ✅ Fixed USE_DATABASE check
            // Check if user already exists
            const userExists = await pool.query("SELECT * FROM users WHERE email = $1 OR username = $2", [email, username]);
            if (userExists.rows.length > 0) {
                return res.status(400).json({ error: "User already exists." });
            }

            // Hash password before storing
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert user into database ✅ Added `role`
            await pool.query("INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)", 
                [username, email, hashedPassword, role]);

            res.status(201).json({ message: "User registered successfully!" });

        } else { 
            // ✅ JSON storage (Same as before)
            const data = fs.readFileSync(dataPath, "utf8");
            let users = JSON.parse(data);

            // Check if user already exists
            if (users.some(user => user.username === username || user.email === email)) {
                return res.status(400).json({ error: "User already exists" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = { username, email, password: hashedPassword, role };
            users.push(newUser);

            fs.writeFileSync(dataPath, JSON.stringify(users, null, 2));

            res.status(201).json({ message: "User registered successfully" });
        }

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});


// User Login
router.post("/login", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        return res.status(400).json({ error: "Username or email is required" });
    }

    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }

    try {
        if (USE_DATABASE) {  // ✅ Fixed `USE_DATABASE` check
            // Find user by username OR email
            const userResult = await pool.query(
                "SELECT * FROM users WHERE username = $1 OR email = $2",
                [username || "", email || ""]
            );

            if (userResult.rows.length === 0) {
                return res.status(400).json({ error: "Invalid username/email or password" });
            }

            const user = userResult.rows[0];

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid username/email or password" });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({ message: "Login successful", token });

        } else { 
            // ✅ JSON-based authentication (Same as before)
            const data = fs.readFileSync(dataPath, "utf8");
            let users = JSON.parse(data);

            // Find user by username OR email
            const user = users.find(user => 
                user.username === username || user.email === email
            );

            if (!user) {
                return res.status(400).json({ error: "Invalid username/email or password" });
            }

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Invalid username/email or password" });
            }

            // Generate JWT token
            const token = jwt.sign(
                { username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({ message: "Login successful", token });
        }

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});


// Protected route example
router.get("/protected", authenticateToken, (req, res) => {
    res.json({ message: "This is a protected route", user: req.user });
});

module.exports = router;
