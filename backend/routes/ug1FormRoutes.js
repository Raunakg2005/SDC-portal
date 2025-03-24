const express = require("express");
const UG1Form = require("../models/UG1Form");

const router = express.Router();

// Submit Form Data (Save per user)
router.post("/submit", async (req, res) => {
  try {
    const { userEmail, ...formData } = req.body; // Extract email

    if (!userEmail) {
      return res.status(400).json({ error: "User email is required." });
    }

    // Save form with userEmail
    const newForm = new UG1Form({ userEmail, ...formData });
    await newForm.save();

    res.status(201).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("❌ Error saving form:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch Form Data (Per user)
router.get("/user/:email", async (req, res) => {
  try {
    const userEmail = req.params.email;

    const forms = await UG1Form.find({ userEmail });
    res.json(forms);
  } catch (error) {
    console.error("❌ Error fetching user forms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
