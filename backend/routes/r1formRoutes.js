import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import { GridFSBucket } from 'mongodb';
import R1Form from '../models/R1Form.js';

dotenv.config();
const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).fields([
  { name: 'bills', maxCount: 10 }, // PDF
  { name: 'zipFiles', maxCount: 2 }, // ZIP
  { name: 'studentSignature', maxCount: 1 }, // PDF/PNG
  { name: 'sdcCoordinatorSignature', maxCount: 1 }, // PDF/PNG
  { name: 'sdcChairpersonSignature', maxCount: 1 }, // PDF/PNG
  { name: 'principalSignature', maxCount: 1 }, // PDF/PNG
]);

router.post('/submit', upload, async (req, res) => {
  try {
    const conn = mongoose.connection;
    const bucket = new GridFSBucket(conn.db, { bucketName: 'r1files' });

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

    const authors = req.body.authors ? JSON.parse(req.body.authors) : [];
    const bankDetails = req.body.bankDetails ? JSON.parse(req.body.bankDetails) : null;

    const proofDocumentFile = req.files?.proofDocument?.[0];
    const receiptCopyFile = req.files?.receiptCopy?.[0];
    const studentSignatureFile = req.files?.studentSignature?.[0];
    const guideSignatureFile = req.files?.guideSignature?.[0];
    const hodSignatureFile = req.files?.hodSignature?.[0];
    const pdfFiles = req.files?.pdfFiles || [];
    const zipFile = req.files?.zipFile?.[0] || null;

    if (!proofDocumentFile || !receiptCopyFile || !studentSignatureFile || !guideSignatureFile || !hodSignatureFile) {
      return res.status(400).json({ error: 'Missing required files.' });
    }

    const proofDocumentFileId = await uploadFile(proofDocumentFile);
    const receiptCopyFileId = await uploadFile(receiptCopyFile);
    const studentSignatureFileId = await uploadFile(studentSignatureFile);
    const guideSignatureFileId = await uploadFile(guideSignatureFile);
    const hodSignatureFileId = await uploadFile(hodSignatureFile);

    const pdfFileIds = [];
    for (const file of pdfFiles) {
      const id = await uploadFile(file);
      pdfFileIds.push(id);
    }

    let zipFileId = null;
    if (zipFile) {
      zipFileId = await uploadFile(zipFile);
    }

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

      proofDocumentFileId,
      receiptCopyFileId,
      studentSignatureFileId,
      guideSignatureFileId,
      hodSignatureFileId,

      pdfFileIds,
      zipFileId,

      dateOfSubmission: req.body.dateOfSubmission ? new Date(req.body.dateOfSubmission) : undefined,
      remarksByHOD: req.body.remarksByHOD || '',
    });

    await newForm.save();

    res.json({ message: 'R1 form submitted successfully!' });
  } catch (error) {
    console.error('R1 form submission error:', error);
    res.status(500).json({ error: 'Failed to submit R1 form' });
  }
});

export default router;
