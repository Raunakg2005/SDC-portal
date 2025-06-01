import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import PG1Form from '../models/PG1Form.js';
import dotenv from 'dotenv';
import { GridFSBucket } from 'mongodb';

dotenv.config();

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload configuration: single + multiple files
const uploadFields = upload.fields([
  { name: 'receiptCopy', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 1 },
  { name: 'guideSignature', maxCount: 1 },
  { name: 'pdfDocuments', maxCount: 5 },
  { name: 'zipFiles', maxCount: 2 },
]);

router.post('/submit', uploadFields, async (req, res) => {
  try {
    const bankDetails = JSON.parse(req.body.bankDetails);
    const conn = mongoose.connection;
    const bucket = new GridFSBucket(conn.db, { bucketName: 'pg1files' });

    const uploadFile = (file) => {
      return new Promise((resolve, reject) => {
        const stream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        stream.end(file.buffer);
        stream.on('finish', () => resolve(stream.id));
        stream.on('error', reject);
      });
    };

    // Required single file uploads
    const receiptCopy = req.files?.receiptCopy?.[0];
    const guideSignature = req.files?.guideSignature?.[0];

    if (!receiptCopy || !guideSignature) {
      return res.status(400).json({ error: 'Required files missing' });
    }

    // Upload required files
    const receiptCopyId = await uploadFile(receiptCopy);
    const guideSignatureId = await uploadFile(guideSignature);

    // Upload optional single file
    const additionalDocumentsId = req.files?.additionalDocuments?.[0]
      ? await uploadFile(req.files.additionalDocuments[0])
      : null;

    // Upload multiple PDF files (max 5)
    const pdfDocuments = req.files?.pdfDocuments || [];
    const pdfDocumentIds = await Promise.all(pdfDocuments.map(uploadFile));

    // Upload multiple ZIP files (max 2)
    const zipFiles = req.files?.zipFiles || [];
    const zipFileIds = await Promise.all(zipFiles.map(uploadFile));

    // Save form with all files
    const newForm = new PG1Form({
      studentName: req.body.studentName,
      yearOfAdmission: req.body.yearOfAdmission,
      feesPaid: req.body.feesPaid,
      sttpTitle: req.body.sttpTitle,
      guideName: req.body.guideName,
      coGuideName: req.body.coGuideName,
      numberOfDays: req.body.numberOfDays,
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      organization: req.body.organization,
      reason: req.body.reason,
      knowledgeUtilization: req.body.knowledgeUtilization,
      bankDetails,
      registrationFee: req.body.registrationFee,
      previousClaim: req.body.previousClaim,
      claimDate: req.body.claimDate,
      amountReceived: req.body.amountReceived,
      amountSanctioned: req.body.amountSanctioned,
      files: {
        receiptCopy: receiptCopyId,
        guideSignature: guideSignatureId,
        additionalDocuments: additionalDocumentsId,
        pdfDocuments: pdfDocumentIds,
        zipFiles: zipFileIds
      },
      status: req.body.status || 'pending',
    });

    await newForm.save();
    res.json({ message: 'PG1 form submitted successfully!' });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Failed to submit PG1 form' });
  }
});

export default router;
