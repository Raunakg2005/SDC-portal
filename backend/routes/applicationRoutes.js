import express from "express";
import mongoose from "mongoose";

// Import your form models here
import UG1Form from "../models/UG1Form.js";
import UG3AForm from "../models/UG3AForm.js";
import UG3BForm from "../models/UG3BForm.js";
import PG1Form from "../models/PG1Form.js";
import PG2AForm from "../models/PG2AForm.js";

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
  formData: form,  // Full form data for details view
});

// GET /api/applications/pending
router.get("/pending", async (req, res) => {
  try {
    console.log("🔍 HIT /pending route");
    // Fetch pending forms from all collections in parallel
    const [ug1, ug3a, ug3b, pg1, pg2a] = await Promise.all([
      UG1Form.find({ status: "pending" }).sort({ createdAt: -1 }),
      UG3AForm.find({ status: "pending" }).sort({ createdAt: -1 }),
      UG3BForm.find({ status: "pending" }).sort({ createdAt: -1 }),
      PG1Form.find({ status: "pending" }).sort({ createdAt: -1 }),
      PG2AForm.find({ status: "pending" }).sort({ createdAt: -1 }),
    ]);

    // Combine & format
    const results = [
      ...ug1.map((f) => formatForm(f, "UG_1")),
      ...ug3a.map((f) => formatForm(f, "UG_3_A")),
      ...ug3b.map((f) => formatForm(f, "UG_3_B")),
      ...pg1.map((f) => formatForm(f, "PG_1")),
      ...pg2a.map((f) => formatForm(f, "PG_2_A")),
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
    const collections = [UG1Form, UG3AForm, UG3BForm, PG1Form, PG2AForm];
    let application = null;
    let foundType = null;

    for (const Model of collections) {
      application = await Model.findById(id);
      if (application) {
        foundType = Model.modelName; // e.g. 'UG1Form'
        break;
      }
    }

    if (!application)
      return res.status(404).json({ message: "Application not found" });

    // Map Mongoose modelName to formType keys for frontend formMapper
    const modelNameToFormType = {
      UG1Form: "UG_1",
      UG3AForm: "UG_3_A",
      UG3BForm: "UG_3_B",
      PG1Form: "PG_1",
      PG2AForm: "PG_2_A",
    };

    const formType = modelNameToFormType[foundType] || "Unknown";

    // Respond with normalized data
    res.json({
      _id: application._id,
      topic: application.projectTitle || application.topic || "Untitled",
      name:
        application.students?.[0]?.name || application.name || "N/A",
      branch:
        application.students?.[0]?.branch || application.branch || "N/A",
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
