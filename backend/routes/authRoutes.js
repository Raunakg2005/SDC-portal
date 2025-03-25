const express = require("express");
const User = require("../models/User"); // Ensure correct path to User model
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/login", async (req, res) => {
    const { svvNetId, password } = req.body;

    console.log("Received Login Request:", svvNetId, password);

    if (!svvNetId || !password) {
        return res.status(400).json({ message: "SVVNetID and password are required." });
    }

    try {
        const user = await User.findOne({ svvNetId });

        console.log("User Found:", user);

        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        // Since no hashing is used, compare directly
        if (password !== user.password) {
            console.log("Password Mismatch");
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ svvNetId: user.svvNetId }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ message: "Login Successful", token });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

module.exports = router;
