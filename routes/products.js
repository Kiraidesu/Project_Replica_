const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const router = express.Router();
const dataPath = path.join(__dirname, "../data/products.json");
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

// Product Data Validation Middleware
const validateProductData = (req, res, next) => {
    const { name, price, category, image } = req.body;
    if (!name || !price || !category || !image) {
        return res.status(400).json({ error: "All product fields are required." });
    }
    if (typeof price !== "number" || price <= 0) {
        return res.status(400).json({ error: "Price must be a positive number." });
    }
    next();
};

// Get all products with pagination, search, and filtering
router.get("/", async (req, res) => {
    try {
        let { page, limit, search, category, minPrice, maxPrice } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        minPrice = parseFloat(minPrice);
        maxPrice = parseFloat(maxPrice);

        if (USE_DATABASE) {
            // Use PostgreSQL
            let query = "SELECT * FROM products WHERE 1=1";
            let countQuery = "SELECT COUNT(*) FROM products WHERE 1=1";
            let values = [];
            let filterIndex = 1;  // Helps maintain proper $ indexing

            if (search) {
                query += ` AND LOWER(name) LIKE LOWER($${filterIndex})`;
                countQuery += ` AND LOWER(name) LIKE LOWER($${filterIndex})`;
                values.push(`%${search}%`);
                filterIndex++;
            }
            if (category) {
                query += ` AND category = $${filterIndex}`;
                countQuery += ` AND category = $${filterIndex}`;
                values.push(category);
                filterIndex++;
            }
            if (!isNaN(minPrice)) {
                query += ` AND price >= $${filterIndex}`;
                countQuery += ` AND price >= $${filterIndex}`;
                values.push(minPrice);
                filterIndex++;
            }
            if (!isNaN(maxPrice)) {
                query += ` AND price <= $${filterIndex}`;
                countQuery += ` AND price <= $${filterIndex}`;
                values.push(maxPrice);
                filterIndex++;
            }

            // Add pagination parameters
            query += ` LIMIT $${filterIndex} OFFSET $${filterIndex + 1}`;
            values.push(limit, (page - 1) * limit);

            // Execute Queries
            const result = await pool.query(query, values);
            const countResult = await pool.query(countQuery, values.slice(0, -2));  // Exclude pagination values
            const totalProducts = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalProducts / limit);

            res.json({
                total: totalProducts,
                page,
                limit,
                totalPages,
                data: result.rows
            });
        } else {
            // Use JSON
            const data = fs.readFileSync(dataPath, "utf8");
            let products = JSON.parse(data);

            // Filtering
            if (search) {
                products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
            }
            if (category) {
                products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
            }
            if (!isNaN(minPrice)) {
                products = products.filter(p => p.price >= minPrice);
            }
            if (!isNaN(maxPrice)) {
                products = products.filter(p => p.price <= maxPrice);
            }

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedProducts = products.slice(startIndex, endIndex);

            res.json({
                total: products.length,
                page,
                limit,
                totalPages: Math.ceil(products.length / limit),
                data: paginatedProducts
            });
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to load products" });
    }
});


// Add a new product (Admin only)
router.post("/", authenticateToken, isAdmin, validateProductData, (req, res) => {
    const { name, price, category, image } = req.body;

    try {
        const data = fs.readFileSync(dataPath, "utf8");
        let products = JSON.parse(data);

        const newProduct = {
            id: products.length + 1,
            name,
            price,
            category,
            image
        };

        products.push(newProduct);
        fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));

        res.status(201).json({ message: "Product added successfully", product: newProduct });
    } catch (error) {
        res.status(500).json({ error: "Failed to add product" });
    }
});

// Update a product (Admin only)
router.put("/:id", authenticateToken, isAdmin, validateProductData, (req, res) => {
    const { id } = req.params;
    const { name, price, category, image } = req.body;

    try {
        const data = fs.readFileSync(dataPath, "utf8");
        let products = JSON.parse(data);

        const productIndex = products.findIndex(p => p.id == id);
        if (productIndex === -1) {
            return res.status(404).json({ error: "Product not found" });
        }

        if (name) products[productIndex].name = name;
        if (price) products[productIndex].price = price;
        if (category) products[productIndex].category = category;
        if (image) products[productIndex].image = image;

        fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));

        res.json({ message: "Product updated successfully", product: products[productIndex] });
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
});

// Delete a product (Admin only)
router.delete("/:id", authenticateToken, isAdmin, (req, res) => {
    const { id } = req.params;

    try {
        const data = fs.readFileSync(dataPath, "utf8");
        let products = JSON.parse(data);

        const productIndex = products.findIndex(p => p.id == id);
        if (productIndex === -1) {
            return res.status(404).json({ error: "Product not found" });
        }

        products.splice(productIndex, 1);
        fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

module.exports = router;
