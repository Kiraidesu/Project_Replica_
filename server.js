const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Import routes
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");

// console.log("JWT Secret Key:", process.env.JWT_SECRET);

app.use(cors());

// Parse JSON
app.use(express.json());

//
app.use("/users", userRoutes);

app.use("/cart",cartRoutes);

app.use("/orders", orderRoutes);

// Use the product routes
app.use("/products", productRoutes);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Route for homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Route for product-page
app.get("/products", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "product.html"));
});


// getting products from database
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.query('SELECT * FROM products');
        res.json(products.rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
