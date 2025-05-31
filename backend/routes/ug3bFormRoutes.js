import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import UG3BForm from '../models/UG3BForm.js';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const upload = multer(); // memory storage

router.post('/submit', upload.fields([
  { name: 'paperCopy', maxCount: 1 },
  { name: 'groupLeaderSignature', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 1 },
  { name: 'guideSignature', maxCount: 1 },
  { name: 'pdfDocuments', maxCount: 5 },      // New: multiple PDFs
  { name: 'zipFiles', maxCount: 2 }           // New: multiple ZIPs
]), async (req, res) => {
  try {
    const {
      studentName,
      yearOfAdmission,
      feesPaid,
      projectTitle,
      guideName,
      employeeCode,
      conferenceDate,
      organization,
      publisher,
      paperLink,
      registrationFee,
      previousClaim,
      claimDate,
      amountReceived,
      amountSanctioned,
    } = req.body;

    // Parse authors
    const authors = Object.keys(req.body)
      .filter(key => key.startsWith('authors['))
      .sort((a, b) => {
        const indexA = parseInt(a.match(/\[(\d+)\]/)[1], 10);
        const indexB = parseInt(b.match(/\[(\d+)\]/)[1], 10);
        return indexA - indexB;
      })
      .map(key => req.body[key]);

    // Parse bankDetails
    const parsedBankDetails = typeof req.body.bankDetails === 'string'
      ? JSON.parse(req.body.bankDetails)
      : req.body.bankDetails;

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'ug3bFiles' });

    // Helper to upload a single file buffer to GridFS and return the file ID + metadata
    const uploadFile = (file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype
        });
        uploadStream.end(file.buffer);
        uploadStream.on('finish', () => resolve({
          id: uploadStream.id,
          filename: file.originalname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }));
        uploadStream.on('error', reject);
      });
    };

    // Upload single files
    const paperCopyData = req.files.paperCopy ? await uploadFile(req.files.paperCopy[0]) : null;
    const groupLeaderSignatureData = req.files.groupLeaderSignature ? await uploadFile(req.files.groupLeaderSignature[0]) : null;
    const additionalDocumentsData = req.files.additionalDocuments ? await uploadFile(req.files.additionalDocuments[0]) : null;
    const guideSignatureData = req.files.guideSignature ? await uploadFile(req.files.guideSignature[0]) : null;

    // Upload multiple PDFs (max 5)
    const pdfDocumentsData = req.files.pdfDocuments
      ? await Promise.all(req.files.pdfDocuments.map(uploadFile))
      : [];

    // Upload multiple ZIPs (max 2)
    const zipFilesData = req.files.zipFiles
      ? await Promise.all(req.files.zipFiles.map(uploadFile))
      : [];

    // Create and save document
    const newEntry = new UG3BForm({
      studentName,
      yearOfAdmission,
      feesPaid,
      projectTitle,
      guideName,
      employeeCode,
      conferenceDate,
      organization,
      publisher,
      paperLink,
      authors,
      bankDetails: {
        beneficiary: parsedBankDetails.beneficiary,
        ifsc: parsedBankDetails.ifsc,
        bankName: parsedBankDetails.bankName,
        branch: parsedBankDetails.branch,
        accountType: parsedBankDetails.accountType,
        accountNumber: parsedBankDetails.accountNumber,
      },
      registrationFee,
      previousClaim,
      claimDate,
      amountReceived,
      amountSanctioned,
      paperCopy: paperCopyData,
      groupLeaderSignature: groupLeaderSignatureData,
      additionalDocuments: additionalDocumentsData,
      guideSignature: guideSignatureData,
      pdfDocuments: pdfDocumentsData,
      zipFiles: zipFilesData,
    });

    await newEntry.save();
    res.status(201).json({ message: 'UG3B form submitted successfully!' });
  } catch (error) {
    console.error('UG3B form submission error:', error);
    res.status(500).json({ error: 'Failed to submit UG3B form' });
  }
});

export default router;
