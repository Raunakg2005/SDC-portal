import express from "express";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb"; // Import GridFSBucket

// Import all your form models here
import UG1Form from "../models/UG1Form.js";
import UGForm2 from "../models/UGForm2.js";
import UG3AForm from "../models/UG3AForm.js"; // IMPORT UG3AForm
import UG3BForm from "../models/UG3BForm.js";
import PG1Form from "../models/PG1Form.js";
import PG2AForm from "../models/PG2AForm.js";
import PG2BForm from "../models/PG2BForm.js";
import R1Form from "../models/R1Form.js";

const router = express.Router();
const conn = mongoose.connection;

let gfsBucket; // Consistent naming for GridFSBucket instance

// Initialize GridFSBucket once the MongoDB connection is open
conn.once("open", () => {
    gfsBucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    console.log("✅ GridFSBucket initialized in application routes");
});

/**
 * Helper: Fetches file details from GridFS and constructs its URL.
 * This function uses the 'gfsBucket' instance to query the 'uploads.files' collection
 * to find file metadata by ID and then constructs a URL for serving the file.
 * @param {mongoose.Types.ObjectId | string} fileId - The GridFS file ID.
 * @param {string} formBaseUrl - The base URL for serving files for this specific form type (e.g., "/api/ug2form/file").
 * @returns {Promise<{id: string, originalName: string, filename: string, mimetype: string, size: number, url: string} | null>} - File details or null.
 */
const getFileDetailsAndUrl = async (fileId, formBaseUrl) => {
    if (!gfsBucket || !fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
        return null;
    }
    try {
        const file = await gfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
        if (file.length > 0) {
            const fileData = file[0];
            return {
                id: fileData._id.toString(),
                originalName: fileData.metadata?.originalName || fileData.filename, // Prefer metadata originalName
                filename: fileData.filename,
                mimetype: fileData.contentType,
                size: fileData.length,
                // IMPORTANT: Construct URL using the provided formBaseUrl
                url: `${formBaseUrl}/${fileData._id.toString()}`,
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
 * @param {string} formType - The type of the form (e.g., "UG_1", "UG_2", "UG_3_A")
 * @returns {Promise<Object>} - The processed form object with URLs and standardized fields.
 */
const processFormForDisplay = async (form, formType) => {
    let processedForm = { ...form };

    // --- Standardize common fields for display ---
    processedForm._id = form._id.toString(); // Ensure _id is a string for frontend consistency
    processedForm.topic = form.projectTitle || form.topic || "Untitled Project";
    processedForm.submitted = form.createdAt || form.submittedAt || new Date();
    processedForm.status = form.status || "pending";
    processedForm.formType = formType;

    // Default URL prefix for files based on form type (adjust if your file routes differ)
    // You should define separate routes for serving files for each form type if they are handled by different routers,
    // or use a single common route like /api/files/:fileId if all forms use the same file serving route.
    // For this example, I'll assume distinct file serving routes for each form.
    let fileBaseUrl = `/api/application/file`; // Generic base for now, adjust per specific form if needed.
    // Add more specific base URLs here if needed (e.g., /api/ug3aform/file)
    // For simplicity, I'll use a generic /api/application/file route for all for this example.
    // If you have a shared file retrieval endpoint, like `router.get('/file/:fileId', ...)`
    // in your main applicationRoutes, then `/api/application/file` is suitable.
    // If each form type has its own file retrieval route (e.g., UG3AForm has a file route in ug3aFormRoutes),
    // then you MUST pass the correct base URL for that form type.

    // Initialize file-related fields to avoid undefined errors on frontend
    processedForm.groupLeaderSignature = null;
    processedForm.guideSignature = null;
    processedForm.uploadedFiles = []; // For UG2 additional documents
    processedForm.pdfFileUrls = []; // For UG1
    processedForm.zipFile = null;   // For UG1, UG3A
    processedForm.uploadedImage = null; // For UG3A, etc.
    processedForm.uploadedPdfs = []; // For UG3A

    processedForm.guideNames = [];
    processedForm.employeeCodes = [];


    // --- Specific file and field processing based on formType ---
    switch (formType) {
        case "UG_1":
            // Debug: log raw form data to see what fields it has
            processedForm.name = form.name 
            || (form.studentDetails && form.studentDetails.length > 0 ? form.studentDetails[0].studentName : "N/A");
            
            // Branch fallback from first student's branch
            processedForm.branch = form.branch 
            || (form.studentDetails && form.studentDetails.length > 0 ? form.studentDetails[0].branch : "N/A");
            
            // Get pdf files URLs
            if (form.pdfFileIds && form.pdfFileIds.length > 0) {
                const pdfFileDetailsPromises = form.pdfFileIds.map(id => getFileDetailsAndUrl(id, fileBaseUrl));
                processedForm.pdfFileUrls = (await Promise.all(pdfFileDetailsPromises)).filter(Boolean);
            }
            // Signature files
            if (form.groupLeaderSignatureId) {
                processedForm.groupLeaderSignature = await getFileDetailsAndUrl(form.groupLeaderSignatureId, fileBaseUrl);
            }
            if (form.guideSignatureId) {
                processedForm.guideSignature = await getFileDetailsAndUrl(form.guideSignatureId, fileBaseUrl);
            }
            
            // Guides details
            processedForm.guideNames = form.guides ? form.guides.map(g => g.guideName || "") : [];
            processedForm.employeeCodes = form.guides ? form.guides.map(g => g.employeeCode || "") : [];
            break;

        case "UG_2":
            processedForm.name = form.students?.[0]?.name || "N/A";
            processedForm.branch = form.students?.[0]?.branch || "N/A";

            if (form.groupLeaderSignature && form.groupLeaderSignature.fileId) { // Check for .fileId
                processedForm.groupLeaderSignature = await getFileDetailsAndUrl(form.groupLeaderSignature.fileId, fileBaseUrl);
            }
            if (form.guideSignature && form.guideSignature.fileId) { // Check for .fileId
                processedForm.guideSignature = await getFileDetailsAndUrl(form.guideSignature.fileId, fileBaseUrl);
            }

            if (form.uploadedFiles && form.uploadedFiles.length > 0) {
                const uploadedFileDetailsPromises = form.uploadedFiles.map(fileMeta => getFileDetailsAndUrl(fileMeta.fileId, fileBaseUrl)); // Check for .fileId
                processedForm.uploadedFiles = (await Promise.all(uploadedFileDetailsPromises)).filter(Boolean);
            }

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

        case "UG_3_A": // --- NEW CASE FOR UG3AForm ---
            processedForm.name = form.students?.[0]?.name || "N/A"; // Assuming students array
            processedForm.branch = form.students?.[0]?.branch || "N/A"; // Assuming students array
            processedForm.organizingInstitute = form.organizingInstitute;
            processedForm.projectTitle = form.projectTitle;
            processedForm.students = form.students;
            processedForm.expenses = form.expenses;
            processedForm.totalAmount = form.totalAmount;
            processedForm.bankDetails = form.bankDetails;

            // Process files specific to UG3AForm
            if (form.uploadedImage && form.uploadedImage.fileId) {
                processedForm.uploadedImage = await getFileDetailsAndUrl(form.uploadedImage.fileId, fileBaseUrl);
            }
            if (form.uploadedPdfs && form.uploadedPdfs.length > 0) {
                const pdfDetailsPromises = form.uploadedPdfs.map(pdfMeta => getFileDetailsAndUrl(pdfMeta.fileId, fileBaseUrl));
                processedForm.uploadedPdfs = (await Promise.all(pdfDetailsPromises)).filter(Boolean);
            }
            if (form.uploadedZipFile && form.uploadedZipFile.fileId) {
                processedForm.zipFile = await getFileDetailsAndUrl(form.uploadedZipFile.fileId, fileBaseUrl);
            }
            break;
            case "PG_2_A":
                processedForm.organizingInstitute = form.organizingInstitute || "N/A";
                processedForm.projectTitle = form.projectTitle || form.topic || "Untitled Project";
                processedForm.studentDetails = form.studentDetails || [];
                processedForm.expenses = form.expenses || [];
                processedForm.bankDetails = form.bankDetails || {};
                
                // Process files from form.files (bills array, zips array, signatures)
                if (form.files) {
                    if (form.files.bills && form.files.bills.length > 0) {
                        const billFilePromises = form.files.bills.map(id => getFileDetailsAndUrl(id, fileBaseUrl));
                        processedForm.bills = (await Promise.all(billFilePromises)).filter(Boolean);
                    } else {
                        processedForm.bills = [];
                    }
            
                    if (form.files.zips && form.files.zips.length > 0) {
                        const zipFilePromises = form.files.zips.map(id => getFileDetailsAndUrl(id, fileBaseUrl));
                        processedForm.zips = (await Promise.all(zipFilePromises)).filter(Boolean);
                    } else {
                        processedForm.zips = [];
                    }
            
                    if (form.files.studentSignature) {
                        processedForm.studentSignature = await getFileDetailsAndUrl(form.files.studentSignature, fileBaseUrl);
                    } else {
                        processedForm.studentSignature = null;
                    }
            
                    if (form.files.guideSignature) {
                        processedForm.guideSignature = await getFileDetailsAndUrl(form.files.guideSignature, fileBaseUrl);
                    } else {
                        processedForm.guideSignature = null;
                    }
            
                    if (form.files.groupLeaderSignature) {
                        processedForm.groupLeaderSignature = await getFileDetailsAndUrl(form.files.groupLeaderSignature, fileBaseUrl);
                    } else {
                        processedForm.groupLeaderSignature = null;
                    }
                }
                break;
        // --- END NEW CASE FOR UG3AForm ---
        default:
            console.warn(`No specific processing defined for form type: ${formType}. Returning raw form data with generic name/branch.`);
            processedForm.name = form.name || form.applicantName || form.studentName || "N/A";
            processedForm.branch = form.branch || form.applicantBranch || form.studentBranch || "N/A";
            break;
    }
    return processedForm;
};

router.get("/pending", async (req, res) => {
    try {
        const [
            ug1Forms,
            ug2Forms,
            ug3aForms, // Added UG3AForm
            ug3bForms,
            pg1Forms,
            pg2aForms,
            pg2bForms,
            r1Forms
        ] = await Promise.all([
            UG1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            UGForm2.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            UG3AForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(), // Fetch UG3AForm
            UG3BForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            PG1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            PG2AForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            PG2BForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            R1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
        ]);

        const results = await Promise.all([
            ...ug1Forms.map(f => processFormForDisplay(f, "UG_1")),
            ...ug2Forms.map(f => processFormForDisplay(f, "UG_2")),
            ...ug3aForms.map(f => processFormForDisplay(f, "UG_3_A")), // Process UG3AForm
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid application ID" });
        }

        const collections = [
            { model: UG1Form, type: "UG_1" },
            { model: UGForm2, type: "UG_2" },
            { model: UG3AForm, type: "UG_3_A" }, // Added UG3AForm
            { model: UG3BForm, type: "UG_3_B" },
            { model: PG1Form, type: "PG_1" },
            { model: PG2AForm, type: "PG_2_A" },
            { model: PG2BForm, type: "PG_2_B" },
            { model: R1Form, type: "R1" }
        ];

        let application = null;
        let foundType = null;

        for (const collection of collections) {
            application = await collection.model.findById(id).lean();
            if (application) {
                foundType = collection.type;
                break;
            }
        }

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const processedApplication = await processFormForDisplay(application, foundType);

        res.json(processedApplication);
    } catch (error) {
        console.error("Error fetching application by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;