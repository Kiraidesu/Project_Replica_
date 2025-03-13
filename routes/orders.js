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

// 1️⃣ **Place an Order (Checkout)**
router.post("/checkout", authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;

        // Get cart items for the user
        const cartItems = await pool.query(`
            SELECT c.product_id, c.quantity, p.price 
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1
        `, [user_id]);

        if (cartItems.rows.length === 0) {
            return res.status(400).json({ error: "Cart is empty." });
        }

        // Calculate total price
        let total_price = 0;
        cartItems.rows.forEach(item => {
            total_price += item.quantity * item.price;
        });

        // Insert order into orders table
        const orderResult = await pool.query(
            "INSERT INTO orders (user_id, total_price) VALUES ($1, $2) RETURNING id",
            [user_id, total_price]
        );

        const order_id = orderResult.rows[0].id;

        // Insert each cart item into order_items table
        for (const item of cartItems.rows) {
            await pool.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
                [order_id, item.product_id, item.quantity, item.price]
            );
        }

		// Decrease stock when order is placed
		await pool.query(
			"UPDATE products SET stock = stock - $1 WHERE id = $2",
			[item.quantity, item.product_id]
		);


        // Clear the user's cart after checkout
        await pool.query("DELETE FROM cart WHERE user_id = $1", [user_id]);

        res.status(201).json({ message: "Order placed successfully.", order_id });
    } catch (error) {
        res.status(500).json({ error: "Failed to place order" });
    }
});

// 3️⃣ User: View Order History with Pagination
router.get("/", authenticateToken, async (req, res) => {
    try {
        let { page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 5;
        const offset = (page - 1) * limit;

        const ordersQuery = `
            SELECT o.id, o.order_date, o.total_price, o.status, o.last_updated, 
                json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) AS items
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = $1
            GROUP BY o.id
            ORDER BY o.order_date DESC
            LIMIT $2 OFFSET $3;
        `;
        
        const result = await pool.query(ordersQuery, [req.user.id, limit, offset]);
        res.json({ total_orders: result.rowCount, page, limit, data: result.rows });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});


// 1️⃣ User: Cancel Order (Only if it's still "Pending")
router.put("/cancel", authenticateToken, async (req, res) => {
    try {
        const { order_id } = req.body;
        if (!order_id) {
            return res.status(400).json({ error: "Order ID is required." });
        }

        console.log(`ℹ Attempting to cancel order ID: ${order_id}`);

        // Check order status before canceling
        const orderCheck = await pool.query("SELECT status FROM orders WHERE id = $1 AND user_id = $2", [order_id, req.user.id]);

        if (orderCheck.rowCount === 0) {
            console.error("❌ Order not found or unauthorized.");
            return res.status(404).json({ error: "Order not found or unauthorized." });
        }

        const currentStatus = orderCheck.rows[0].status;
        if (currentStatus !== "Pending") {
            console.error("⚠ Order cannot be canceled as it is already processed.");
            return res.status(400).json({ error: "Order cannot be canceled as it is already processed." });
        }

        // Update status to "Cancelled"
        const cancelOrder = await pool.query(
            "UPDATE orders SET status = 'Cancelled', last_updated = NOW() WHERE id = $1 RETURNING *",
            [order_id]
        );

        if (cancelOrder.rowCount === 0) {
            console.error("❌ Order update failed.");
            return res.status(500).json({ error: "Failed to cancel order. Database update failed." });
        }

        console.log(`✅ Order ID: ${order_id} successfully canceled.`);

        // Restore stock if order is canceled
        const restoreStockQuery = `
            UPDATE products 
            SET stock = stock + (SELECT quantity FROM order_items WHERE order_id = $1 AND product_id = products.id) 
            WHERE id IN (SELECT product_id FROM order_items WHERE order_id = $1)
        `;

        const restoreStock = await pool.query(restoreStockQuery, [order_id]);

        console.log(`🔄 Stock restored for Order ID: ${order_id}`);

        res.status(200).json({ message: "Order canceled successfully.", order: cancelOrder.rows[0] });
    } catch (error) {
        console.error("🚨 Error canceling order:", error);
        res.status(500).json({ error: "Failed to cancel order. Internal Server Error." });
    }
});




// 4️⃣ Admin: Get All Orders
router.get("/all", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }

        const orders = await pool.query(`
            SELECT o.id, o.order_date, o.total_price, o.status, u.username,
                   json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) AS items
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, u.username
            ORDER BY o.order_date DESC
        `);

        res.json({ orders: orders.rows });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve orders" });
    }
});


// 3️⃣ Admin: Update Order Status (Improved)
router.put("/update", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied. Admins only." });
        }

        const { order_id, status } = req.body;
        if (!order_id || !status) {
            return res.status(400).json({ error: "Order ID and status are required." });
        }

        const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status provided." });
        }

        const updateResult = await pool.query(
            "UPDATE orders SET status = $1, last_updated = NOW() WHERE id = $2 RETURNING *",
            [status, order_id]
        );

        if (updateResult.rowCount === 0) {
            return res.status(404).json({ error: "Order not found." });
        }

        res.status(200).json({ message: "Order status updated successfully.", updated_order: updateResult.rows[0] });
    } catch (error) {
        res.status(500).json({ error: "Failed to update order status" });
    }
});


module.exports = router;
