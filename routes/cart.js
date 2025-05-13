const express = require("express");
const router = express.Router();
const pool = require("../db");  // Ensure DB connection is correct
const authenticateToken = require("../middleware/auth");

// 🛒 Get Cart Items for Logged-in User
router.get("/", authenticateToken, async (req, res) => {
    try {
        const cartItems = await pool.query(
            "SELECT c.id, p.name, p.price, c.quantity FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1",
            [req.user.id]
        );
        res.json({ cart: cartItems.rows });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: "Failed to retrieve cart" });
    }
});

// ➕ Add to Cart
router.post("/add", authenticateToken, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        await pool.query(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity",
            [req.user.id, product_id, quantity]
        );
        res.json({ message: "Item added to cart" });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: "Failed to add item to cart" });
    }
});

// ❌ Remove Item from Cart
router.delete("/remove/:id", authenticateToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM cart WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
        res.json({ message: "Item removed from cart" });
    } catch (error) {
        console.error("Error removing item:", error);
        res.status(500).json({ error: "Failed to remove item from cart" });
    }
});

module.exports = router;
