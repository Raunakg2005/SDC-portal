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

const router = express.Router();

// Helper to format application data uniformly
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

// GET /api/applications/pending
router.get("/pending", async (req, res) => {
  try {
    console.log("🔍 HIT /pending route");
    // Fetch pending forms from all collections in parallel
    const [ug1, ug2, ug3a, ug3b, pg1, pg2a, pg2b] = await Promise.all([
      UG1Form.find({ status: { $regex: /^pending$/i } }).sort({ createdAt: -1 }),
      UGForm2.find({ status: { $regex: /^pending$/i } }).sort({ createdAt: -1 }),
      UG3AForm.find({ status: { $regex: /^pending$/i } }).sort({ createdAt: -1 }),
      UG3BForm.find({ status: { $regex: /^pending$/i } }).sort({ createdAt: -1 }),
      PG1Form.find({ status: { $regex: /^pending$/i } }).sort({ createdAt: -1 }),
      PG2AForm.find({ status: { $regex: /^pending$/i } }).sort({ createdAt: -1 }),
      PG2BForm.find({ status: { $regex: /^pending$/i } }).sort({ createdAt: -1 }),  // <== Important
    ]);

    // Combine & format
    const results = [
      ...ug1.map((f) => formatForm(f, "UG_1")),
      ...ug2.map((f) => formatForm(f, "UG_2")),   
      ...ug3a.map((f) => formatForm(f, "UG_3_A")),
      ...ug3b.map((f) => formatForm(f, "UG_3_B")),
      ...pg1.map((f) => formatForm(f, "PG_1")),
      ...pg2a.map((f) => formatForm(f, "PG_2_A")),
      ...pg2b.map((f) => formatForm(f, "PG_2_B")),
    ];

    res.json(results);
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/applications/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });

    // Search all collections for the ID
    const collections = [UG1Form, UGForm2, UG3AForm, UG3BForm, PG1Form, PG2AForm, PG2BForm];  // Added UGForm2 here
    let application = null;
    let foundType = null;

    for (const Model of collections) {
      application = await Model.findById(id);
      if (application) {
        foundType = Model.modelName;
        break;
      }
    }

    if (!application)
      return res.status(404).json({ message: "Application not found" });

    // Map Mongoose modelName to formType keys for frontend formMapper
    const modelNameToFormType = {
      UG1Form: "UG_1",
      UGForm2: "UG_2",     // Added mapping for UGForm2
      UG3AForm: "UG_3_A",
      UG3BForm: "UG_3_B",
      PG1Form: "PG_1",
      PG2AForm: "PG_2_A",
      PG2BForm: "PG_2_B",
    };

    const formType = modelNameToFormType[foundType] || "Unknown";

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
