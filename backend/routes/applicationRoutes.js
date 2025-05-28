import express from "express";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb"; // Import GridFSBucket

// Import all your form models here
import UG1Form from "../models/UG1Form.js";
import UGForm2 from "../models/UGForm2.js";
import UG3AForm from "../models/UG3AForm.js";
import UG3BForm from "../models/UG3BForm.js";
import PG1Form from "../models/PG1Form.js";
import PG2AForm from "../models/PG2AForm.js";
import PG2BForm from "../models/PG2BForm.js";
import R1Form from "../models/R1Form.js";

const router = express.Router();
const conn = mongoose.connection;

let gfs; // GridFSBucket instance for this router

// Initialize GridFSBucket once the MongoDB connection is open
// This ensures 'gfs' is ready to interact with the 'uploads' bucket (uploads.files and uploads.chunks collections)
conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, { bucketName: "uploads" });
  console.log("✅ GridFS initialized in application routes");
});

/**
 * Helper: Fetches file details from GridFS and constructs its URL.
 * This function uses the 'gfs' instance to query the 'uploads.files' collection
 * to find file metadata by ID and then constructs a URL for serving the file.
 * @param {mongoose.Types.ObjectId | string} fileId - The GridFS file ID.
 * @returns {Promise<{name: string, url: string} | null>} - File details or null.
 */
const getFileDetailsAndUrl = async (fileId) => {
  if (!gfs || !fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
    return null;
  }
  try {
    // Find the file in the 'uploads.files' collection using its _id
    const file = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    if (file.length > 0) {
      return {
        name: file[0].filename,
        // Construct the URL. This assumes your Express app has a route
        // like `app.use('/uploads/files', fileRoutes);` where fileRoutes handles
        // serving files from GridFS based on their ID.
        url: `http://localhost:5000/uploads/files/${fileId}`,
      };
    }
  } catch (error) {
    console.error(`Error fetching file details for ID ${fileId}:`, error);
  }
  return null;
};

/**
 * Helper: Processes a raw form object to include file URLs based on its type.
 * This function iterates through potential file ID fields within the form data
 * and uses `getFileDetailsAndUrl` to resolve them into accessible URLs.
 * @param {Object} form - The raw Mongoose document (after .lean())
 * @returns {Promise<Object>} - The processed form object with URLs
 */
const processFormForDisplay = async (form) => {
  let processedForm = { ...form };

  if (form._doc) {
    processedForm = { ...form._doc };
  }

  // Access the actual form data which is nested under 'formData' for Application objects
  // If it's a direct UG1Form document (e.g., from ug1formRoutes), formData will be undefined,
  // so we fall back to the top-level form fields.
  const actualFormData = processedForm.formData || processedForm;

  // Initialize these on the *main* processedForm object to be consistent with frontend expectations
  processedForm.pdfFileUrls = [];
  processedForm.zipFile = null;
  processedForm.groupLeaderSignatureUrl = null;
  processedForm.groupLeaderSignatureName = null;
  processedForm.guideSignatureUrl = null;
  processedForm.guideSignatureName = null;

  // IMPORTANT: Map 'guides' array. Use actualFormData.guides
  processedForm.guideNames = actualFormData.guides ? actualFormData.guides.map(g => g.guideName || "") : [""];
  processedForm.employeeCodes = actualFormData.guides ? actualFormData.guides.map(g => g.employeeCode || "") : [""];

  switch (form.formType) {
    case "UG_1":
      // Process PDF files (individual or zip) - NOW USING actualFormData
      // Checks for array of PDF file IDs and resolves each to a URL
      if (actualFormData.pdfFileIds && actualFormData.pdfFileIds.length > 0) {
        const pdfFileDetailsPromises = actualFormData.pdfFileIds.map(id => getFileDetailsAndUrl(id));
        const pdfFileUrls = (await Promise.all(pdfFileDetailsPromises)).filter(Boolean);
        processedForm.pdfFileUrls = pdfFileUrls;
      } else if (actualFormData.zipFileId) {
        // Checks for a single zip file ID and resolves it to a URL
        const zipFileDetails = await getFileDetailsAndUrl(actualFormData.zipFileId);
        processedForm.zipFile = zipFileDetails;
      }
      // Process Group Leader Signature - NOW USING actualFormData
      // Resolves the group leader signature file ID to a URL and name
      if (actualFormData.groupLeaderSignatureId) {
        const glSig = await getFileDetailsAndUrl(actualFormData.groupLeaderSignatureId);
        if (glSig) {
          processedForm.groupLeaderSignatureUrl = glSig.url;
          processedForm.groupLeaderSignatureName = glSig.name;
        }
      }
      // Process Guide Signature - NOW USING actualFormData
      // Resolves the guide signature file ID to a URL and name
      if (actualFormData.guideSignatureId) {
        const guideSig = await getFileDetailsAndUrl(actualFormData.guideSignatureId);
        if (guideSig) {
          processedForm.guideSignatureUrl = guideSig.url;
          processedForm.guideSignatureName = guideSig.name;
        }
      }
      break;
    // Add cases for other form types, they would also need to access their specific file ID fields
    // e.g., if (actualFormData.someOtherFormFileId) ...
  }
  return processedForm;
};
/**
 * Helper: Uniformly format application data for frontend summary.
 * This helper now calls processFormForDisplay to get the full formData,
 * including resolved file URLs.
 * @param {Object} form - Mongoose document or plain object
 * @param {string} type - Form type key for frontend mapping
 * @returns {Object} - Formatted application summary
 */
const formatForm = async (form, type) => { // Made async
  const processedFormData = await processFormForDisplay(form, type); // Process the form data

  return {
    _id: form._id,
    topic: form.projectTitle || form.topic || "Untitled",
    name: form.students?.[0]?.name || form.name || "N/A", // Assuming first student is applicant
    branch: form.students?.[0]?.branch || form.branch || "N/A",
    submitted: form.createdAt || form.submittedAt || new Date(),
    formType: type,
    status: form.status || "pending",
    formData: processedFormData, // Pass the processed data
  };
};

/**
 * @route   GET /api/application/pending
 * @desc    Fetch all pending applications across all forms
 * @access  Public (adjust as per your auth)
 */
router.get("/pending", async (req, res) => {
  try {
    // Fetch pending forms in parallel, sorted by newest first
    const [
      ug1Forms,
      ug2Forms,
      ug3aForms,
      ug3bForms,
      pg1Forms,
      pg2aForms,
      pg2bForms,
      r1Forms
    ] = await Promise.all([
      UG1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
      UGForm2.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
      UG3AForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
      UG3BForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
      PG1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
      PG2AForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
      PG2BForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
      R1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
    ]);

    // Combine and format all results, processing each form for display
    // Promise.all is used here because formatForm is an async function
    const results = await Promise.all([
      ...ug1Forms.map((f) => formatForm(f, "UG_1")),
      ...ug2Forms.map((f) => formatForm(f, "UG_2")),
      ...ug3aForms.map((f) => formatForm(f, "UG_3_A")),
      ...ug3bForms.map((f) => formatForm(f, "UG_3_B")),
      ...pg1Forms.map((f) => formatForm(f, "PG_1")),
      ...pg2aForms.map((f) => formatForm(f, "PG_2_A")),
      ...pg2bForms.map((f) => formatForm(f, "PG_2_B")),
      ...r1Forms.map(f => formatForm(f, "R1")),
    ]);

    res.json(results);
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/application/:id
 * @desc    Fetch specific application by ID from all form collections
 * @access  Public (adjust as per your auth)
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const collections = [
      { model: UG1Form, type: "UG_1" },
      { model: UGForm2, type: "UG_2" },
      { model: UG3AForm, type: "UG_3_A" },
      { model: UG3BForm, type: "UG_3_B" },
      { model: PG1Form, type: "PG_1" },
      { model: PG2AForm, type: "PG_2_A" },
      { model: PG2BForm, type: "PG_2_B" },
      { model: R1Form, type: "R1" }
    ];

    let application = null;
    let foundType = null;

    // Search in all collections until found
    for (const collection of collections) {
      application = await collection.model.findById(id).lean(); // Use .lean() for plain JS objects
      if (application) {
        foundType = collection.type; // Store the frontend form type
        break;
      }
    }

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Process the found application data to include file URLs
    // This step is crucial for fetching the file details from GridFS (uploads.files)
    const formatted = await formatForm(application, foundType);

    // Return full application data with metadata
    res.json({
      _id: processedFormData._id, // Use processed ID
      topic: processedFormData.projectTitle || processedFormData.topic || "Untitled",
      name: processedFormData.studentDetails?.[0]?.studentName || processedFormData.name || "N/A", // Adjust based on your model's student field
      branch: processedFormData.studentDetails?.[0]?.branch || processedFormData.branch || "N/A", // Adjust based on your model's student field
      submitted: processedFormData.createdAt || new Date(),
      formType: foundType, // Use the determined form type
      formData: processedFormData, // This now contains all URLs
      status: processedFormData.status || "pending",
    });
  } catch (error) {
    console.error("Error fetching application by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
