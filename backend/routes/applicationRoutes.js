import express from "express";
import mongoose from "mongoose";

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

/**
 * Helper: Uniformly format application data for frontend
 * @param {Object} form - Mongoose document or plain object
 * @param {string} type - Form type key for frontend mapping
 * @returns {Object} - Formatted application summary
 */
const formatForm = (form, type) => ({
  _id: form._id,
  topic: form.projectTitle || form.topic || "Untitled",
  name: form.students?.[0]?.name || form.name || "N/A",
  branch: form.students?.[0]?.branch || form.branch || "N/A",
  submitted: form.createdAt || form.submittedAt || new Date(),
  formType: type,
  status: form.status || "pending",
  formData: form,
});

/**
 * @route   GET /api/application/pending
 * @desc    Fetch all pending applications across all forms
 * @access  Public (adjust as per your auth)
 */
router.get("/pending", async (req, res) => {
  try {
    // Fetch pending forms in parallel, sorted by newest first
    const [
      ug1,
      ug2,
      ug3a,
      ug3b,
      pg1,
      pg2a,
      pg2b,
      r1
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

    // Combine and format all results
    const results = [
      ...ug1.map((f) => formatForm(f, "UG_1")),
      ...ug2.map((f) => formatForm(f, "UG_2")),
      ...ug3a.map((f) => formatForm(f, "UG_3_A")),
      ...ug3b.map((f) => formatForm(f, "UG_3_B")),
      ...pg1.map((f) => formatForm(f, "PG_1")),
      ...pg2a.map((f) => formatForm(f, "PG_2_A")),
      ...pg2b.map((f) => formatForm(f, "PG_2_B")),
      ...r1.map(f => formatForm(f, "R1")),
    ];

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
      UG1Form,
      UGForm2,
      UG3AForm,
      UG3BForm,
      PG1Form,
      PG2AForm,
      PG2BForm,
      R1Form
    ];

    let application = null;
    let foundType = null;

    // Search in all collections until found
    for (const Model of collections) {
      application = await Model.findById(id).lean();
      if (application) {
        foundType = Model.modelName;
        break;
      }
    }

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Map mongoose model names to your frontend form keys
    const modelNameToFormType = {
      UG1Form: "UG_1",
      UGForm2: "UG_2",
      UG3AForm: "UG_3_A",
      UG3BForm: "UG_3_B",
      PG1Form: "PG_1",
      PG2AForm: "PG_2_A",
      PG2BForm: "PG_2_B",
      R1Form: "R1",
    };

    const formType = modelNameToFormType[foundType] || "Unknown";

    // Return full application data with metadata
    res.json({
      _id: application._id,
      topic: application.projectTitle || application.topic || "Untitled",
      name: application.students?.[0]?.name || application.name || "N/A",
      branch: application.students?.[0]?.branch || application.branch || "N/A",
      submitted: application.createdAt || new Date(),
      formType,
      formData: application,
      status: application.status || "pending",
    });
  } catch (error) {
    console.error("Error fetching application by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
