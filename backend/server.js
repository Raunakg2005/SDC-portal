require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const ug1FormRoutes = require("./routes/ug1FormRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

//  Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

//  Serve uploaded files
app.use("/uploads", express.static("uploads"));

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/ug1form", ug1FormRoutes);
app.use("/api/upload", uploadRoutes);

//  MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "Users",
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

  //  Global Error Handling
  app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  });
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));