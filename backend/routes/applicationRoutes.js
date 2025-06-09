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
import R1Form from "../models/R1Form.js"; // Import R1Form

const router = express.Router();
const conn = mongoose.connection;

let gfsBucket; // Consistent naming for GridFSBucket instance

// Initialize GridFSBucket once the MongoDB connection is open
conn.once("open", () => {
    // IMPORTANT: Ensure this bucketName matches where your files are actually stored.
    // If your R1Form backend uses 'r1files' bucket, you'll need to adapt this,
    // or ensure all forms write to 'uploads'. Consistency is key.
    gfsBucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    console.log("✅ GridFSBucket initialized in application routes (using 'uploads' bucket)");
});

/**
 * Helper: Fetches file details from GridFS and constructs its URL.
 * This function uses the 'gfsBucket' instance to query the 'uploads.files' collection
 * to find file metadata by ID and then constructs a URL for serving the file.
 * @param {mongoose.Types.ObjectId | string} fileId - The GridFS file ID.
 * @param {string} baseUrlForServingFile - The base URL for serving files from this endpoint (e.g., "/api/application/file").
 * @returns {Promise<{id: string, originalName: string, filename: string, mimetype: string, size: number, url: string} | null>} - File details or null.
 */
const getFileDetailsAndUrl = async (fileId, baseUrlForServingFile) => {
    // Validate fileId before attempting to convert to ObjectId
    if (!gfsBucket || !fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
        console.warn(`Invalid or missing fileId for GridFS lookup: ${fileId}`);
        return null;
    }
    try {
        const file = await gfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
        if (file.length > 0) {
            const fileData = file[0];
            return {
                id: fileData._id.toString(),
                originalName: fileData.metadata?.originalName || fileData.filename, // Prefer metadata.originalName if available
                filename: fileData.filename,
                mimetype: fileData.contentType,
                size: fileData.length,
                // IMPORTANT: Construct URL using the provided baseUrlForServingFile
                url: `${baseUrlForServingFile}/${fileData._id.toString()}`,
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
 * @param {string} formType - The type of the form (e.g., "UG_1", "UG_2", "UG_3_A", "R1")
 * @returns {Promise<Object>} - The processed form object with URLs and standardized fields.
 */
const processFormForDisplay = async (form, formType) => {
    let processedForm = { ...form };

    // --- Standardize common fields for display ---
    processedForm._id = form._id.toString(); // Ensure _id is a string for frontend consistency
    // Standardize 'topic' and 'name' fields, as they vary across forms
    processedForm.topic = form.projectTitle || form.paperTitle || form.topic || "Untitled Project";
    processedForm.name = form.studentName || form.applicantName || (form.students?.[0]?.name) || (form.studentDetails?.[0]?.studentName) || "N/A";
    processedForm.branch = form.branch || form.department || (form.students?.[0]?.branch) || (form.studentDetails?.[0]?.branch) || "N/A";

    // Standardize submission date
    processedForm.submitted = form.createdAt || form.submittedAt || new Date();
    // Ensure date is a proper Date object for formatting on frontend
    if (typeof processedForm.submitted === 'string' && !isNaN(new Date(processedForm.submitted))) {
        processedForm.submitted = new Date(processedForm.submitted);
    } else if (!(processedForm.submitted instanceof Date)) {
        processedForm.submitted = new Date(); // Fallback if not string or invalid date
    }

    processedForm.status = form.status || "pending";
    processedForm.formType = formType;

    // Define the base URL for serving files for THIS specific form's attachments.
    // This assumes you have a central route like '/api/application/file/:fileId'
    // in your main applicationRoutes that fetches files from the 'uploads' bucket.
    // If different forms use different file retrieval routes, adjust this accordingly.
    const fileBaseUrl = `/api/application/file`;

    // Initialize file-related fields to avoid undefined errors on frontend
    processedForm.groupLeaderSignature = null;
    processedForm.studentSignature = null; // Added for R1Form and PG2AForm
    processedForm.guideSignature = null;
    processedForm.hodSignature = null; // Added for R1Form
    processedForm.sdcChairpersonSignature = null; // Added for R1Form
    processedForm.uploadedFiles = []; // For UG2 additional documents
    processedForm.pdfFileUrls = []; // For UG1, R1
    processedForm.zipFile = null;   // For UG1, UG3A, R1, PG2A
    processedForm.uploadedImage = null; // For UG3A
    processedForm.uploadedPdfs = []; // For UG3A, PG2A (bills)
    processedForm.bills = []; // For PG2A (bills)

    // Standardize guideNames and employeeCodes (e.g., from UG1Form, R1Form)
    processedForm.guideNames = [];
    processedForm.employeeCodes = [];

    // --- Specific file and field processing based on formType ---
    switch (formType) {
        case "UG_1":
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

            // Guides details (assuming UG1 stores guides as an array of objects)
            processedForm.guideNames = form.guides ? form.guides.map(g => g.guideName || "") : [];
            processedForm.employeeCodes = form.guides ? form.guides.map(g => g.employeeCode || "") : [];

            break;

        case "UG_2":
            // Student and branch are already handled generically above, but can be explicitly set here if needed
            // processedForm.name = form.students?.[0]?.name || "N/A";
            // processedForm.branch = form.students?.[0]?.branch || "N/A";

            // Signatures (checking .fileId because UG2 stores signatures as objects)
            if (form.groupLeaderSignature && form.groupLeaderSignature.fileId) {
                processedForm.groupLeaderSignature = await getFileDetailsAndUrl(form.groupLeaderSignature.fileId, fileBaseUrl);
            }
            if (form.guideSignature && form.guideSignature.fileId) {
                processedForm.guideSignature = await getFileDetailsAndUrl(form.guideSignature.fileId, fileBaseUrl);
            }

            // Other uploaded files for UG2
            if (form.uploadedFiles && form.uploadedFiles.length > 0) {
                const uploadedFileDetailsPromises = form.uploadedFiles.map(fileMeta => getFileDetailsAndUrl(fileMeta.fileId, fileBaseUrl));
                processedForm.uploadedFiles = (await Promise.all(uploadedFileDetailsPromises)).filter(Boolean);
            }

            // Copy other specific fields
            processedForm.projectDescription = form.projectDescription;
            processedForm.utility = form.utility;
            processedForm.receivedFinance = form.receivedFinance;
            processedForm.financeDetails = form.financeDetails;
            processedForm.guideName = form.guideName; // Assuming guideName is a string here
            processedForm.employeeCode = form.employeeCode; // Assuming employeeCode is a string here
            processedForm.students = form.students;
            processedForm.expenses = form.expenses;
            processedForm.totalBudget = form.totalBudget;
            break;

        case "UG_3_A":
            // Student and branch already handled generically above
            // processedForm.name = form.students?.[0]?.name || "N/A";
            // processedForm.branch = form.students?.[0]?.branch || "N/A";

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

            // Copy other specific fields
            processedForm.organizingInstitute = form.organizingInstitute;
            processedForm.projectTitle = form.projectTitle; // Used for 'topic' standardization
            processedForm.students = form.students;
            processedForm.expenses = form.expenses;
            processedForm.totalAmount = form.totalAmount;
            processedForm.bankDetails = form.bankDetails;
            break;

            case "PG_2_A":
                processedForm.topic = form.projectTitle || form.paperTitle || form.topic || "Untitled Project";
                processedForm.name = form.studentDetails?.[0]?.name || "N/A"; // Explicitly set for PG_2_A
                processedForm.branch = form.department || (form.studentDetails?.[0]?.branch) || "N/A"; // Explicitly set for PG_2_A
    
                processedForm.department = form.department || "NA";
                processedForm.studentDetails = form.studentDetails || [];
                processedForm.expenses = form.expenses || [];
                processedForm.bankDetails = form.bankDetails || {};
                processedForm.organizingInstitute = form.organizingInstitute || "N/A";
                processedForm.guideNames = form.guideName ? [form.guideName] : [];
                processedForm.employeeCodes = form.employeeCode ? [form.employeeCode] : [];
    
                if (form.files) {
                    if (form.files.bills && form.files.bills.length > 0) {
                        const billFilePromises = form.files.bills.map(id => getFileDetailsAndUrl(id, fileBaseUrl));
                        processedForm.bills = (await Promise.all(billFilePromises)).filter(Boolean);
                    } else {
                        processedForm.bills = [];
                    }
                    if (form.files.zips && form.files.zips.length > 0) {
                        const zipFilePromises = form.files.zips.map(id => getFileDetailsAndUrl(id, fileBaseUrl));
                        processedForm.zipFile = (await Promise.all(zipFilePromises)).filter(Boolean)[0] || null;
                    } else {
                        processedForm.zipFile = null;
                    }
                    if (form.files.studentSignature) {
                        processedForm.studentSignature = await getFileDetailsAndUrl(form.files.studentSignature, fileBaseUrl);
                    }
                    if (form.files.guideSignature) {
                        processedForm.guideSignature = await getFileDetailsAndUrl(form.files.guideSignature, fileBaseUrl);
                    }
                    if (form.files.groupLeaderSignature) {
                        processedForm.groupLeaderSignature = await getFileDetailsAndUrl(form.files.groupLeaderSignature, fileBaseUrl);
                    }
                }
                break;

        case "R1":
            // Student name, branch, topic are already handled generically above
            // processedForm.name = form.studentName;
            // processedForm.branch = form.branch;
            // processedForm.topic = form.paperTitle;

            // R1 Specific Signatures
            if (form.studentSignatureFileId) {
                processedForm.studentSignature = await getFileDetailsAndUrl(form.studentSignatureFileId, fileBaseUrl);
            }
            if (form.guideSignatureFileId) {
                processedForm.guideSignature = await getFileDetailsAndUrl(form.guideSignatureFileId, fileBaseUrl);
            }
            if (form.hodSignatureFileId) {
                processedForm.hodSignature = await getFileDetailsAndUrl(form.hodSignatureFileId, fileBaseUrl);
            }
            if (form.sdcChairpersonSignatureFileId) {
                processedForm.sdcChairpersonSignature = await getFileDetailsAndUrl(form.sdcChairpersonSignatureFileId, fileBaseUrl);
            }

            // R1 Specific Files
            if (form.proofDocumentFileId) { // For a single proof document
                processedForm.proofDocument = await getFileDetailsAndUrl(form.proofDocumentFileId, fileBaseUrl);
            }
            if (form.pdfFileIds && form.pdfFileIds.length > 0) { // For multiple PDF attachments
                const pdfFileDetailsPromises = form.pdfFileIds.map(id => getFileDetailsAndUrl(id, fileBaseUrl));
                processedForm.pdfFileUrls = (await Promise.all(pdfFileDetailsPromises)).filter(Boolean);
            }
            if (form.zipFileId) {
                processedForm.zipFile = await getFileDetailsAndUrl(form.zipFileId, fileBaseUrl);
            }
            
            // R1 Specific other fields (already copied generically, but good to ensure)
            processedForm.coGuideName = form.coGuideName;
            processedForm.employeeCodes = form.employeeCodes; // Assuming employeeCodes is a single string here
            processedForm.yearOfAdmission = form.yearOfAdmission;
            processedForm.rollNo = form.rollNo;
            processedForm.mobileNo = form.mobileNo;
            processedForm.feesPaid = form.feesPaid;
            processedForm.receivedFinance = form.receivedFinance;
            processedForm.financeDetails = form.financeDetails;
            processedForm.paperLink = form.paperLink;
            processedForm.authors = form.authors;
            processedForm.sttpTitle = form.sttpTitle;
            processedForm.organizers = form.organizers;
            processedForm.reasonForAttending = form.reasonForAttending;
            processedForm.numberOfDays = form.numberOfDays;
            processedForm.dateFrom = form.dateFrom;
            processedForm.dateTo = form.dateTo;
            processedForm.registrationFee = form.registrationFee;
            processedForm.bankDetails = form.bankDetails;
            processedForm.amountClaimed = form.amountClaimed;
            processedForm.finalAmountSanctioned = form.finalAmountSanctioned;
            processedForm.dateOfSubmission = form.dateOfSubmission;
            processedForm.remarksByHOD = form.remarksByHOD;
            break;

        default:
            console.warn(`No specific processing defined for form type: ${formType}. Returning raw form data with generic name/branch.`);
            // Generic name/branch/topic already applied at the top
            break;
    }
    return processedForm;
};

// --- API Endpoints ---

/**
 * @route  GET /api/application/pending
 * @desc   Fetch all pending applications from all form collections
 * @access Public (adjust as per your auth)
 */
router.get("/pending", async (req, res) => {
    try {
        const [
            ug1Forms,
            ug2Forms,
            ug3aForms,
            ug3bForms,
            pg1Forms,
            pg2aForms,
            pg2bForms,
            r1Forms // Added R1Form
        ] = await Promise.all([
            UG1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            UGForm2.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            UG3AForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            UG3BForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            PG1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            PG2AForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            PG2BForm.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(),
            R1Form.find({ status: /^pending$/i }).sort({ createdAt: -1 }).lean(), // Fetch R1Form
        ]);

        const results = await Promise.all([
            ...ug1Forms.map(f => processFormForDisplay(f, "UG_1")),
            ...ug2Forms.map(f => processFormForDisplay(f, "UG_2")),
            ...ug3aForms.map(f => processFormForDisplay(f, "UG_3_A")),
            ...ug3bForms.map(f => processFormForDisplay(f, "UG_3_B")),
            ...pg1Forms.map(f => processFormForDisplay(f, "PG_1")),
            ...pg2aForms.map(f => processFormForDisplay(f, "PG_2_A")),
            ...pg2bForms.map(f => processFormForDisplay(f, "PG_2_B")),
            ...r1Forms.map(f => processFormForDisplay(f, "R1")), // Process R1Form
        ]);

        res.json(results);
    } catch (error) {
        console.error("Error fetching pending applications:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route  GET /api/application/:id
 * @desc   Fetch specific application by ID from all form collections
 * @access Public (adjust as per your auth)
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
            { model: UG3AForm, type: "UG_3_A" },
            { model: UG3BForm, type: "UG_3_B" },
            { model: PG1Form, type: "PG_1" },
            { model: PG2AForm, type: "PG_2_A" },
            { model: PG2BForm, type: "PG_2_B" },
            { model: R1Form, type: "R1" } // Added R1Form
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


// You might need a general file serving route here if `fileBaseUrl` points to this router.
// For example:
router.get('/file/:fileId', async (req, res) => {
    if (!gfsBucket) {
        return res.status(503).json({ message: "GridFS is not initialized." });
    }
    try {
        const fileId = req.params.fileId;
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({ message: "Invalid file ID." });
        }

        const files = await gfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: "File not found." });
        }

        const file = files[0];

        // Set headers for file download/display
        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', `inline; filename="${file.filename}"`); // 'inline' to display in browser, 'attachment' to download

        // Stream the file
        const downloadStream = gfsBucket.openDownloadStream(file._id);
        downloadStream.pipe(res);

        downloadStream.on('error', (err) => {
            console.error(`Error streaming file ${fileId}:`, err);
            res.status(500).json({ message: "Error streaming file." });
        });

    } catch (error) {
        console.error("Error retrieving file from GridFS:", error);
        res.status(500).json({ message: "Server error." });
    }
});


export default router;