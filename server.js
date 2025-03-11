const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Import routes
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");

// console.log("JWT Secret Key:", process.env.JWT_SECRET);


// Parse JSON
app.use(express.json());

//
app.use("/users", userRoutes);

// Use the product routes
app.use("/products", productRoutes);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Route for homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
