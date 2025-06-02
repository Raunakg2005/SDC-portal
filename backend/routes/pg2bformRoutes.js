import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import { GridFSBucket } from 'mongodb';
import PG2BForm from '../models/PG2BForm.js';

dotenv.config();
const router = express.Router();

// Multer setup with memory storage to buffer files for GridFS upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Accept specific file fields
const uploadFields = upload.fields([
  { name: 'paperCopy', maxCount: 1 },
  { name: 'groupLeaderSignature', maxCount: 1 },
  { name: 'guideSignature', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 },
]);

// POST /submit
router.post('/submit', uploadFields, async (req, res) => {
  try {
    const conn = mongoose.connection;
    const bucket = new GridFSBucket(conn.db, { bucketName: 'pg2bfiles' });

    // Upload helper function
    const uploadFile = (file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        uploadStream.end(file.buffer);
        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', (error) => reject(error));
      });
    };

    // Parse complex fields
    const authors = JSON.parse(req.body.authors);
    const bankDetails = JSON.parse(req.body.bankDetails);

    // Extract files
    const paperCopyFile = req.files?.paperCopy?.[0];
    const groupLeaderSignatureFile = req.files?.groupLeaderSignature?.[0];
    const guideSignatureFile = req.files?.guideSignature?.[0];
    const additionalDocumentsFiles = req.files?.additionalDocuments || [];

    // Validate required files
    if (!paperCopyFile || !groupLeaderSignatureFile || !guideSignatureFile) {
      return res.status(400).json({ error: 'Missing required files' });
    }

    // Upload files to GridFS
    const paperCopyFileId = await uploadFile(paperCopyFile);
    const groupLeaderSignatureFileId = await uploadFile(groupLeaderSignatureFile);
    const guideSignatureFileId = await uploadFile(guideSignatureFile);
    const additionalDocumentsFileIds = await Promise.all(
      additionalDocumentsFiles.map(uploadFile)
    );

    // Create and save form
    const newForm = new PG2BForm({
      studentName: req.body.studentName,
      yearOfAdmission: req.body.yearOfAdmission,
      feesPaid: req.body.feesPaid,
      projectTitle: req.body.projectTitle,
      guideName: req.body.guideName,
      coGuideName: req.body.coGuideName,
      conferenceDate: new Date(req.body.conferenceDate),
      organization: req.body.organization,
      publisher: req.body.publisher,
      paperLink: req.body.paperLink,
      authors,
      bankDetails,
      registrationFee: req.body.registrationFee,
      previousClaim: req.body.previousClaim,
      claimDate: req.body.claimDate ? new Date(req.body.claimDate) : undefined,
      amountReceived: req.body.amountReceived || undefined,
      amountSanctioned: req.body.amountSanctioned || undefined,
      status: req.body.status || 'pending',
      paperCopyFilename: paperCopyFileId,
      groupLeaderSignatureFilename: groupLeaderSignatureFileId,
      guideSignatureFilename: guideSignatureFileId,
      additionalDocumentsFilename: additionalDocumentsFileIds.length > 0 ? additionalDocumentsFileIds : [],
    });

    await newForm.save();

    res.status(200).json({ message: 'PG2B form submitted successfully' });
  } catch (err) {
    console.error('PG2B form submission error:', err);
    res.status(500).json({ error: 'Failed to submit PG2B form' });
  }
});

export default router;
