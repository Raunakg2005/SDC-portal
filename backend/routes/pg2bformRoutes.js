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

// Accept specified file fields (including groupLeaderSignature to avoid unexpected field error)
const uploadFields = upload.fields([
  { name: 'paperCopy', maxCount: 1 },
  { name: 'groupLeaderSignature', maxCount: 1 },
  { name: 'guideSignature', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 }, // optional additional files
]);

router.post('/submit', uploadFields, async (req, res) => {
  try {
    const conn = mongoose.connection;
    const bucket = new GridFSBucket(conn.db, { bucketName: 'pg2bfiles' });

    // Helper function to upload a single file buffer to GridFS, returns ObjectId
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

    // Parse nested JSON fields (authors, bankDetails) sent as stringified JSON in body
    const authors = JSON.parse(req.body.authors);
    const bankDetails = JSON.parse(req.body.bankDetails);

    // Extract uploaded files
    const paperCopyFile = req.files?.paperCopy?.[0];
    const groupLeaderSignatureFile = req.files?.groupLeaderSignature?.[0];
    const guideSignatureFile = req.files?.guideSignature?.[0];
    const additionalDocumentsFiles = req.files?.additionalDocuments || [];

    // Validate that required files are present
    if (!paperCopyFile || !groupLeaderSignatureFile || !guideSignatureFile) {
      return res.status(400).json({ error: 'Required files are missing' });
    }

    // Upload each file to GridFS and get their ObjectIds
    const paperCopyFileId = await uploadFile(paperCopyFile);
    const groupLeaderSignatureFileId = await uploadFile(groupLeaderSignatureFile);
    const guideSignatureFileId = await uploadFile(guideSignatureFile);
    const additionalDocumentsFileIds = await Promise.all(
      additionalDocumentsFiles.map(uploadFile)
    );

    // Create new document with all data, matching your Mongoose schema
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
      claimDate: req.body.claimDate ? new Date(req.body.claimDate) : null,
      amountReceived: req.body.amountReceived,
      amountSanctioned: req.body.amountSanctioned,
      status: req.body.status || 'Pending',

      // Store GridFS file ObjectIds for each uploaded file
      paperCopyFilename: paperCopyFileId,
      groupLeaderSignatureFilename: groupLeaderSignatureFileId,
      guideSignatureFilename: guideSignatureFileId,
      additionalDocumentsFilename: additionalDocumentsFileIds.length
        ? additionalDocumentsFileIds
        : undefined,
    });

    // Save form to database
    await newForm.save();

    res.json({ message: 'PG2B form submitted successfully!' });
  } catch (err) {
    console.error('PG2B form submission error:', err);
    res.status(500).json({ error: 'Failed to submit PG2B form' });
  }
});

export default router;
