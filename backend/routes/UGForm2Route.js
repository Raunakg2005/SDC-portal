import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import { GridFSBucket } from "mongodb";
import UGForm2 from "../models/UGForm2.js";

const router = express.Router();

const conn = mongoose.connection;
let gfsBucket;
let storage;

conn.once("open", () => {
  gfsBucket = new GridFSBucket(conn.db, { bucketName: "uploads" });

  storage = new GridFsStorage({
    db: conn.db,
    file: (req, file) => ({
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: "uploads",
    }),
  });

  console.log("✅ GridFS and Storage initialized successfully");
});

const upload = multer({ storage });

router.post(
  "/saveFormData",
  upload.fields([
    { name: "groupLeaderSignature", maxCount: 1 },
    { name: "guideSignature", maxCount: 1 },
    { name: "uploadedFiles", maxCount: 6 }, // max 5 PDFs + 1 ZIP
  ]),
  async (req, res) => {
    const uploadedFileIds = [];

    try {
      const { files } = req;
      const groupLeaderSignatureFile = files["groupLeaderSignature"]?.[0];
      const guideSignatureFile = files["guideSignature"]?.[0];
      const additionalDocuments = files["uploadedFiles"] || [];

      // Track uploaded file IDs
      if (groupLeaderSignatureFile) uploadedFileIds.push(groupLeaderSignatureFile.id);
      if (guideSignatureFile) uploadedFileIds.push(guideSignatureFile.id);
      additionalDocuments.forEach(file => uploadedFileIds.push(file.id));

      // === Signature Validation ===
      const checkSignature = (file, label) => {
        if (file.mimetype !== "image/jpeg" || file.size > 5 * 1024 * 1024) {
          throw new Error(`${label} must be a JPEG image under 5MB.`);
        }
      };

      if (!groupLeaderSignatureFile || !guideSignatureFile) {
        return res.status(400).json({ message: "Both signatures are required." });
      }

      checkSignature(groupLeaderSignatureFile, "Group Leader Signature");
      checkSignature(guideSignatureFile, "Guide Signature");

      // === Uploaded Files Validation ===
      let pdfCount = 0;
      let zipCount = 0;

      for (const file of additionalDocuments) {
        if (file.mimetype === "application/pdf") {
          pdfCount++;
          if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "Each PDF must be ≤ 5MB." });
          }
        } else if (
          file.mimetype === "application/zip" ||
          file.mimetype === "application/x-zip-compressed"
        ) {
          zipCount++;
          if (file.size > 25 * 1024 * 1024) {
            return res.status(400).json({ message: "ZIP must be ≤ 25MB." });
          }
        } else {
          return res.status(400).json({ message: "Only PDF or ZIP files allowed." });
        }
      }

      if (pdfCount > 5) {
        return res.status(400).json({ message: "You can upload a maximum of 5 PDFs." });
      }

      if (zipCount > 1) {
        return res.status(400).json({ message: "Only one ZIP file allowed." });
      }

      // === Parse Fields ===
      const students = JSON.parse(req.body.students || "[]");
      const expensesRaw = JSON.parse(req.body.expenses || "[]");
      const guideDetails = JSON.parse(req.body.guideDetails || "[]");

      if (!Array.isArray(students) || students.length === 0) {
        throw new Error("At least one student must be provided.");
      }

      if (!Array.isArray(expensesRaw) || expensesRaw.length === 0) {
        throw new Error("At least one expense entry must be provided.");
      }

      if (!Array.isArray(guideDetails) || guideDetails.length === 0) {
        throw new Error("At least one guide must be provided.");
      }

      const expenses = expensesRaw.map(exp => ({
        category: exp.category?.trim() || "",
        amount: parseFloat(exp.amount) || 0,
        details: exp.details?.trim() || "",
      }));

      const groupLeaderSignatureMetadata = {
        originalName: groupLeaderSignatureFile.originalname,
        filename: groupLeaderSignatureFile.filename,
        mimetype: groupLeaderSignatureFile.mimetype,
        size: groupLeaderSignatureFile.size,
        id: groupLeaderSignatureFile.id,
      };

      const guideSignatureMetadata = {
        originalName: guideSignatureFile.originalname,
        filename: guideSignatureFile.filename,
        mimetype: guideSignatureFile.mimetype,
        size: guideSignatureFile.size,
        id: guideSignatureFile.id,
      };

      const uploadedFilesMetadata = additionalDocuments.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        id: file.id,
      }));

      const newForm = new UGForm2({
        svvNetId: req.body.svvNetId,
        projectTitle: req.body.projectTitle,
        projectDescription: req.body.projectDescription,
        utility: req.body.utility,
        receivedFinance: req.body.receivedFinance === "true",
        financeDetails: req.body.receivedFinance === "true" ? req.body.financeDetails : undefined,
        guideDetails,
        students,
        expenses,
        totalBudget: Number(req.body.totalBudget),
        groupLeaderSignature: groupLeaderSignatureMetadata,
        guideSignature: guideSignatureMetadata,
        uploadedFiles: uploadedFilesMetadata,
        status: req.body.status || "pending",
      });

      const savedForm = await newForm.save();

      res.status(201).json({
        message: "Form saved successfully!",
        id: savedForm._id,
      });
    } catch (err) {
      console.error("❌ Error saving form:", err.message);

      // Cleanup uploaded files
      for (const fileId of uploadedFileIds) {
        if (fileId && gfsBucket) {
          try {
            await gfsBucket.delete(new mongoose.Types.ObjectId(fileId));
            console.log(`🧹 Rolled back file: ${fileId}`);
          } catch (deleteErr) {
            console.error(`⚠️ Failed to delete file ${fileId}:`, deleteErr.message);
          }
        }
      }

      res.status(500).json({ message: "Error saving form", error: err.message });
    }
  }
);

export default router;
