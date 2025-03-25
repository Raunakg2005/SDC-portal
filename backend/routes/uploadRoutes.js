const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const multer = require("multer");

// Set up Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// File upload route
router.post("/upload", upload.array("documents", 5), uploadController.uploadFiles);

module.exports = router;
