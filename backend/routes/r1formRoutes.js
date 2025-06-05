import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import { GridFSBucket } from 'mongodb';
import R1Form from '../models/R1Form.js';

dotenv.config();
const router = express.Router();

// === Multer Setup ===
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
}).fields([
  { name: 'proofDocument', maxCount: 1 },
  { name: 'studentSignature', maxCount: 1 },
  { name: 'guideSignature', maxCount: 1 },
  { name: 'hodSignature', maxCount: 1 },
  { name: 'sdcChairpersonSignature', maxCount: 1 }, // optional
  { name: 'pdfs', maxCount: 5 },
  { name: 'zipFile', maxCount: 1 }, // <--- CHANGED THIS BACK TO 'zipFile'
]);

// === POST /submit route ===
router.post('/submit', upload, async (req, res) => {
  try {
    const conn = mongoose.connection;
    const bucket = new GridFSBucket(conn.db, { bucketName: 'r1files' });

    // Debug logs
    console.log('Received body:', req.body);
    console.log('Received files:', Object.keys(req.files || {}));

    const uploadFile = (file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        uploadStream.end(file.buffer);
        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', reject);
      });
    };

    // Parse JSON fields
    const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
    const bankDetails = req.body.bankDetails ? JSON.parse(req.body.bankDetails) : null;

    // Extract files from req.files
    const {
      proofDocument, // This will now be the single proof document, if any
      studentSignature,
      guideSignature,
      hodSignature,
      sdcChairpersonSignature,
      pdfs = [],
      zipFile, // <--- CHANGED THIS BACK TO 'zipFile'
    } = req.files || {};

    // --- IMPORTANT CHANGE: Updated required files check ---
    // Now, 'proofDocument' can be fulfilled by either the single 'proofDocument' field
    // or by the 'pdfs' array. The backend should check for AT LEAST ONE.
    if (!studentSignature?.[0] || !guideSignature?.[0] || !hodSignature?.[0] || (!proofDocument?.[0] && pdfs.length === 0)) {
        return res.status(400).json({ error: 'Missing one or more required files (studentSignature, guideSignature, hodSignature, or proofDocument/pdfs).' });
    }

    // Upload required files to GridFS
    const studentSignatureFileId = await uploadFile(studentSignature[0]);
    const guideSignatureFileId = await uploadFile(guideSignature[0]);
    const hodSignatureFileId = await uploadFile(hodSignature[0]);

    let proofDocumentFileId = null;
    if (proofDocument?.[0]) {
        proofDocumentFileId = await uploadFile(proofDocument[0]);
    }

    // Optional signature
    let sdcChairpersonSignatureFileId = null;
    if (sdcChairpersonSignature?.[0]) {
      sdcChairpersonSignatureFileId = await uploadFile(sdcChairpersonSignature[0]);
    }

    // Upload PDF files (sent as 'pdfs' from frontend)
    const pdfFileIds = [];
    for (const file of pdfs) {
      const id = await uploadFile(file);
      pdfFileIds.push(id);
    }

    // Upload ZIP if present (sent as 'zipFile' from frontend)
    let zipFileId = null;
    if (zipFile?.[0]) { // <--- CHANGED THIS BACK TO 'zipFile'
      zipFileId = await uploadFile(zipFile[0]); // <--- CHANGED THIS BACK TO 'zipFile'
    }

    // Create and save form document
    const newForm = new R1Form({
      guideName: req.body.guideName,
      coGuideName: req.body.coGuideName || '',
      employeeCodes: req.body.employeeCodes,
      studentName: req.body.studentName,
      yearOfAdmission: req.body.yearOfAdmission,
      branch: req.body.branch,
      rollNo: req.body.rollNo,
      mobileNo: req.body.mobileNo,
      feesPaid: req.body.feesPaid,
      receivedFinance: req.body.receivedFinance,
      financeDetails: req.body.financeDetails || '',

      paperTitle: req.body.paperTitle || '',
      paperLink: req.body.paperLink || '',
      authors,

      sttpTitle: req.body.sttpTitle || '',
      organizers: req.body.organizers || '',
      reasonForAttending: req.body.reasonForAttending || '',
      numberOfDays: req.body.numberOfDays ? Number(req.body.numberOfDays) : 0,
      dateFrom: req.body.dateFrom ? new Date(req.body.dateFrom) : null,
      dateTo: req.body.dateTo ? new Date(req.body.dateTo) : null,
      registrationFee: req.body.registrationFee || '',

      bankDetails,

      amountClaimed: req.body.amountClaimed || '',
      finalAmountSanctioned: req.body.finalAmountSanctioned || '',
      status: req.body.status || 'pending',

      proofDocumentFileId: proofDocumentFileId,
      studentSignatureFileId,
      guideSignatureFileId,
      hodSignatureFileId,
      sdcChairpersonSignatureFileId,

      pdfFileIds,
      zipFileId, // Retain the variable name for the model

      dateOfSubmission: req.body.dateOfSubmission ? new Date(req.body.dateOfSubmission) : undefined,
      remarksByHOD: req.body.remarksByHOD || '',
    });

    await newForm.save();

    res.json({ message: '✅ R1 form submitted successfully!' });
  } catch (error) {
    console.error('❌ R1 form submission error:', error);
    res.status(500).json({ error: 'Failed to submit R1 form' });
  }
});

export default router;