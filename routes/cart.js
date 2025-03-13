const express = require("express");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const router = express.Router();
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

    jwt.verify(tokenParts[1], process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user;
        next();
    });
};

// 1️⃣ **Add Product to Cart**
router.post("/add", authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || quantity < 1) {
            return res.status(400).json({ error: "Product ID and valid quantity are required." });
        }

        const user_id = req.user.id;

        // Check if product exists
        const productCheck = await pool.query("SELECT * FROM products WHERE id = $1", [product_id]);
        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: "Product not found." });
        }

        // Check if item already in cart
        const cartCheck = await pool.query("SELECT * FROM cart WHERE user_id = $1 AND product_id = $2", [user_id, product_id]);
        if (cartCheck.rows.length > 0) {
            // Update quantity if product already in cart
            await pool.query("UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3",
                [quantity, user_id, product_id]);
            return res.status(200).json({ message: "Cart updated successfully." });
        }

        // Insert new cart item
        await pool.query("INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)", 
            [user_id, product_id, quantity]);

        res.status(201).json({ message: "Product added to cart." });
    } catch (error) {
        res.status(500).json({ error: "Failed to add to cart" });
    }
});

// 2️⃣ **Get Cart Items**
router.get("/", authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;

        const cartItems = await pool.query(`
            SELECT c.id, p.name, p.price, c.quantity, (p.price * c.quantity) AS total_price
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1
        `, [user_id]);

        res.json({ cart: cartItems.rows });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve cart" });
    }
});

// 3️⃣ **Update Cart Quantity**
router.put("/update", authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        if (!product_id || quantity < 1) {
            return res.status(400).json({ error: "Product ID and valid quantity are required." });
        }

        const user_id = req.user.id;

        const updateResult = await pool.query("UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3",
            [quantity, user_id, product_id]);

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ error: "Cart item not found." });
        }

        res.status(200).json({ message: "Cart updated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to update cart" });
    }
});

// 4️⃣ **Remove Product from Cart**
router.delete("/remove", authenticateToken, async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id) {
            return res.status(400).json({ error: "Product ID is required." });
        }

        const user_id = req.user.id;

        const deleteResult = await pool.query("DELETE FROM cart WHERE user_id = $1 AND product_id = $2",
            [user_id, product_id]);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: "Cart item not found." });
        }

        res.status(200).json({ message: "Product removed from cart." });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove from cart" });
    }
});

module.exports = router;
