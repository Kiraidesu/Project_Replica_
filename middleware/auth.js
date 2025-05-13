const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    console.log("🟡 Received Token in Backend:", token); // ✅ Log received token

    if (!token) {
        console.log("❌ No token provided!");
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("❌ Invalid Token:", err.message);
            return res.status(403).json({ error: "Invalid token." });
        }
        console.log("✅ Decoded User:", user); // ✅ Log decoded user data
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
