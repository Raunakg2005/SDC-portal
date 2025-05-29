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

let gfsBucket; // Consistent naming for GridFSBucket instance (changed from 'gfs')

// Initialize GridFSBucket once the MongoDB connection is open
conn.once("open", () => {
    gfsBucket = new GridFSBucket(conn.db, { bucketName: "uploads" }); // Use gfsBucket
    console.log("✅ GridFSBucket initialized in application routes");
});

/**
 * Helper: Fetches file details from GridFS and constructs its URL.
 * This function uses the 'gfsBucket' instance to query the 'uploads.files' collection
 * to find file metadata by ID and then constructs a URL for serving the file.
 * @param {mongoose.Types.ObjectId | string} fileId - The GridFS file ID.
 * @returns {Promise<{id: string, originalName: string, filename: string, mimetype: string, size: number, url: string} | null>} - File details or null.
 */
const getFileDetailsAndUrl = async (fileId) => {
    if (!gfsBucket || !fileId || !mongoose.Types.ObjectId.isValid(fileId)) { // Use gfsBucket
        return null;
    }
    try {
        // Find the file in the 'uploads.files' collection using its _id
        const file = await gfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray(); // Use gfsBucket
        if (file.length > 0) {
            const fileData = file[0];
            return {
                id: fileData._id.toString(), // Convert ObjectId to string for frontend
                originalName: fileData.metadata?.originalName || fileData.filename.split('-').slice(1).join('-') || fileData.filename, // Try to get original name if stored in metadata, else parse from filename
                filename: fileData.filename, // The name Multer saved it as
                mimetype: fileData.contentType, // GridFS uses contentType
                size: fileData.length, // GridFS uses length for size
                // IMPORTANT: This URL must match your file serving route in UGForm2Route.js
                // Assuming /api/ug2form is the base route for forms that serve files.
                url: `/api/ug2form/file/${fileData._id.toString()}`,
            };
        }
    } catch (error) {
        console.error(`Error fetching file details for ID ${fileId}:`, error);
    }
    return null;
};

/**
 * Helper: Processes a raw form object to include file URLs and standardizes fields for display.
 * @param {Object} form - The raw Mongoose document (after .lean())
 * @param {string} formType - The type of the form (e.g., "UG_1", "UG_2")
 * @returns {Promise<Object>} - The processed form object with URLs and standardized fields.
 */
const processFormForDisplay = async (form, formType) => {
    let processedForm = { ...form }; // Start with a copy of the lean document

    // --- Standardize common fields for display ---
    processedForm._id = form._id;
    processedForm.topic = form.projectTitle || form.topic || "Untitled Project";
    processedForm.submitted = form.createdAt || form.submittedAt || new Date();
    processedForm.status = form.status || "pending";
    processedForm.formType = formType; // Explicitly set formType

    // Initialize file-related fields to avoid undefined errors on frontend
    processedForm.groupLeaderSignature = null;
    processedForm.guideSignature = null;
    processedForm.uploadedFiles = []; // For UG2 additional documents
    processedForm.pdfFileUrls = []; // For UG1
    processedForm.zipFile = null;   // For UG1
    processedForm.guideNames = []; // For UG1
    processedForm.employeeCodes = []; // For UG1

    // --- Specific file and field processing based on formType ---
    switch (formType) {
        case "UG_1":
            processedForm.name = form.name || (form.students?.[0]?.name || "N/A"); // UG1 might have top-level name or students array
            processedForm.branch = form.branch || (form.students?.[0]?.branch || "N/A");

            // Process files specific to UG1Form
            if (form.pdfFileIds && form.pdfFileIds.length > 0) {
                const pdfFileDetailsPromises = form.pdfFileIds.map(id => getFileDetailsAndUrl(id));
                processedForm.pdfFileUrls = (await Promise.all(pdfFileDetailsPromises)).filter(Boolean);
            } else if (form.zipFileId) {
                processedForm.zipFile = await getFileDetailsAndUrl(form.zipFileId);
            }
            if (form.groupLeaderSignatureId) {
                processedForm.groupLeaderSignature = await getFileDetailsAndUrl(form.groupLeaderSignatureId);
            }
            if (form.guideSignatureId) {
                processedForm.guideSignature = await getFileDetailsAndUrl(form.guideSignatureId);
            }
            processedForm.guideNames = form.guides ? form.guides.map(g => g.guideName || "") : [];
            processedForm.employeeCodes = form.guides ? form.guides.map(g => g.employeeCode || "") : [];
            // Add other UG1 specific fields here if needed for frontend display
            break;

        case "UG_2":
            processedForm.name = form.students?.[0]?.name || "N/A";
            processedForm.branch = form.students?.[0]?.branch || "N/A";

            // Process signatures for UGForm2 (which store file metadata objects directly with 'id')
            if (form.groupLeaderSignature && form.groupLeaderSignature.id) {
                processedForm.groupLeaderSignature = await getFileDetailsAndUrl(form.groupLeaderSignature.id);
            }
            if (form.guideSignature && form.guideSignature.id) {
                processedForm.guideSignature = await getFileDetailsAndUrl(form.guideSignature.id);
            }

            // Process additional uploaded files for UGForm2
            if (form.uploadedFiles && form.uploadedFiles.length > 0) {
                const uploadedFileDetailsPromises = form.uploadedFiles.map(fileMeta => getFileDetailsAndUrl(fileMeta.id));
                processedForm.uploadedFiles = (await Promise.all(uploadedFileDetailsPromises)).filter(Boolean);
            }

            // Add other UG2 specific fields here
            processedForm.projectDescription = form.projectDescription;
            processedForm.utility = form.utility;
            processedForm.receivedFinance = form.receivedFinance;
            processedForm.financeDetails = form.financeDetails;
            processedForm.guideName = form.guideName;
            processedForm.employeeCode = form.employeeCode;
            processedForm.students = form.students;
            processedForm.expenses = form.expenses;
            processedForm.totalBudget = form.totalBudget;
            break;

        // Add cases for other form types (UG3AForm, UG3BForm, PG1Form, etc.)
        // Ensure you handle their specific file fields and data structures as needed.
        default:
            console.warn(`No specific processing defined for form type: ${formType}. Returning raw form data with generic name/branch.`);
            // Fallback for other forms
            processedForm.name = form.name || form.applicantName || form.studentName || "N/A";
            processedForm.branch = form.branch || form.applicantBranch || form.studentBranch || "N/A";
            break;
    }
    return processedForm;
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
        // Promise.all is used here because processFormForDisplay is an async function
        const results = await Promise.all([
            ...ug1Forms.map(f => processFormForDisplay(f, "UG_1")),
            ...ug2Forms.map(f => processFormForDisplay(f, "UG_2")),
            ...ug3aForms.map(f => processFormForDisplay(f, "UG_3_A")),
            ...ug3bForms.map(f => processFormForDisplay(f, "UG_3_B")),
            ...pg1Forms.map(f => processFormForDisplay(f, "PG_1")),
            ...pg2aForms.map(f => processFormForDisplay(f, "PG_2_A")),
            ...pg2bForms.map(f => processFormForDisplay(f, "PG_2_B")),
            ...r1Forms.map(f => processFormForDisplay(f, "R1")),
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
            // If application is not found in the current collection, try the next one
        }

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Process the found application data to include file URLs and standardize fields
        const processedApplication = await processFormForDisplay(application, foundType);

        // Return the full processed application data directly
        res.json(processedApplication); // <-- CORRECTED: Return processedApplication directly
    } catch (error) {
        console.error("Error fetching application by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;