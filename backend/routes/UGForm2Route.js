import express from "express";
import mongoose from "mongoose"; // ✅ Use `import` instead of `require`
import multer from "multer";
import { GridFsStorage } from "multer-gridfs-storage";
import { GridFSBucket } from "mongodb";
import UGForm2 from "../models/UGForm2.js"; // ✅ Ensure correct ES Module import

const router = express.Router();
// ✅ MongoDB Connection
const conn = mongoose.connection;
let gfs;
let gfsBucket;

// ✅ GridFS Storage Setup
let storage;

conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, { bucketName: "uploads" });

  storage = new GridFsStorage({
    db: conn.db,  // ✅ Use the connected database
    file: (req, file) => ({
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: "uploads",
    }),
  });
  console.log("✅ GridFS and Storage initialized successfully");
});
const uploadedFileIds = []; // for rollback on error
const upload = multer({ storage });
router.post('/saveFormData', upload.fields([
  { name: 'groupLeaderSignature', maxCount: 1 },
  { name: 'guideSignature', maxCount: 1 },
  { name: 'uploadedFiles', maxCount: 6 },
]), async (req, res) => {
  try {
    const { files } = req;
    const groupLeaderSignatureFile = files['groupLeaderSignature']?.[0];
    const guideSignatureFile = files['guideSignature']?.[0];
    const additionalDocuments = files['uploadedFiles'] || [];

    // Record uploaded file ids for cleanup if needed
    if (groupLeaderSignatureFile) uploadedFileIds.push(groupLeaderSignatureFile.id);
    if (guideSignatureFile) uploadedFileIds.push(guideSignatureFile.id);
    additionalDocuments.forEach(file => uploadedFileIds.push(file.id));

    // === Signature validation ===
    if (!groupLeaderSignatureFile) {
      return res.status(400).json({ message: "Group leader signature is required." });
    }
    if (!guideSignatureFile) {
      return res.status(400).json({ message: "Guide signature is required." });
    }
    if (groupLeaderSignatureFile.mimetype !== 'image/jpeg' || groupLeaderSignatureFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Group leader signature must be a JPEG under 5MB." });
    }
    if (guideSignatureFile.mimetype !== 'image/jpeg' || guideSignatureFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Guide signature must be a JPEG under 5MB." });
    }

    // === File validation ===
    const totalFiles = additionalDocuments.length;
    if (totalFiles > 5) {
      if (totalFiles !== 1 || additionalDocuments[0].mimetype !== 'application/zip') {
        return res.status(400).json({
          message: "Upload max 5 PDF files (each ≤ 5MB) OR 1 ZIP file (≤ 25MB).",
        });
      }
      if (additionalDocuments[0].size > 25 * 1024 * 1024) {
        return res.status(400).json({ message: "ZIP file must be ≤ 25MB." });
      }
    } else {
      for (const file of additionalDocuments) {
        if (file.mimetype !== 'application/pdf') {
          return res.status(400).json({ message: "Only PDF files allowed (max 5)." });
        }
        if (file.size > 5 * 1024 * 1024) {
          return res.status(400).json({ message: "Each PDF file must be ≤ 5MB." });
        }
      }
    }

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
      projectTitle: req.body.projectTitle,
      projectDescription: req.body.projectDescription,
      utility: req.body.utility,
      receivedFinance: req.body.receivedFinance === 'true',
      financeDetails: req.body.financeDetails,
      guideName: req.body.guideName,
      employeeCode: req.body.guideEmployeeCode,
      students: JSON.parse(req.body.students),
      expenses: JSON.parse(req.body.expenses),
      totalBudget: req.body.totalBudget,
      groupLeaderSignature: groupLeaderSignatureMetadata,
      guideSignature: guideSignatureMetadata,
      uploadedFiles: uploadedFilesMetadata,
      status: req.body.status || "pending",
    });

    const savedForm = await newForm.save();
    uploadedFileIds.length = 0; // Clear rollback list
    res.status(201).json({ message: "Form saved successfully!", formId: savedForm._id });
  } catch (err) {
    console.error("❌ Error saving form:", err);

    for (const fileId of uploadedFileIds) {
      if (fileId) {
        try {
          await gfsBucket.delete(new mongoose.Types.ObjectId(fileId));
          console.log(`🧹 Deleted file: ${fileId}`);
        } catch (deleteErr) {
          console.error(`❌ Failed to delete file ${fileId}:`, deleteErr.message);
        }
      }
    }

    res.status(500).json({ message: "Error saving form", error: err.message });
  }
});
export default router;