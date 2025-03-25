const express = require("express");
const multer = require("multer");
const UG1Form = require("../models/UG1Form");

const router = express.Router();

// ✅ Set up storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with extension
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ✅ Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed!"), false);
    }
    cb(null, true);
  }
});

// ✅ Submit Form Data (with File)
router.post("/submit", upload.single("document"), async (req, res) => {
  try {
      console.log("📌 Form Submission Received:", req.body);
      console.log("📌 File Received:", req.file);

      const { svvNetId, ...formData } = req.body;

      if (!svvNetId) {
          return res.status(400).json({ error: "User SVVNet ID is required." });
      }

      // ✅ Construct and Save Form Data
      const newForm = new UG1Form({
          svvNetId, // ✅ Ensure svvNetId is stored
          ...formData,
          document: req.file
              ? { filename: req.file.filename, url: `/uploads/${req.file.filename}` }
              : null,
      });

      await newForm.save();
      res.status(201).json({ message: "Form submitted successfully!" });
  } catch (error) {
      console.error("❌ Error saving form:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Fetch Form Data for a User
router.get("/user/:svvNetId", async (req, res) => {
  try {
      const { svvNetId } = req.params;
      const forms = await UG1Form.find({ svvNetId });

      res.json(forms);
  } catch (error) {
      console.error("❌ Error fetching user forms:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
