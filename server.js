const express = require("express");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 3000;

const authenticateToken = require("./middleware/auth");

// Import routes
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// console.log("JWT Secret Key:", process.env.JWT_SECRET);

app.use(cors());

// Parse JSON
app.use(express.json());

//
app.use("/users", userRoutes);


app.use("/api/cart",cartRoutes);

app.use("/orders", orderRoutes);

// Use the product routes
app.use("/products", productRoutes);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Route for homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Route for product page
app.get("/product", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "product.html"));
});

// Route for sign in-page
app.get("/signin", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "signin.html"));
});

// Route for sign up page
app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "signup.html"));
});

// Route for profile page
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "profile.html"));
});

// Route for edit-profile page
app.get("/edit-profile", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "edit-profile.html"));
});

// Route for cart page
app.get("/cart", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "cart.html"));
});
// nav bar handling
app.get("/js/navbar.js", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "js", "navbar.js"));
});


app.get("/users/me", authenticateToken, async (req, res) => {
    try {
        const user = await pool.query("SELECT id, username, email, role FROM users WHERE id = $1", [req.user.id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error fetching user data" });
    }
});

// 
app.get("/users/profile", authenticateToken, async (req, res) => {
    try {
        //console.log("🔍 Debug: req.user =", req.user); // ✅ Debugging log

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized: No user data in token" });
        }

        const userId = req.user.id;
        const userQuery = await pool.query("SELECT username, email FROM users WHERE id = $1", [userId]);

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(userQuery.rows[0]);
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});





// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
