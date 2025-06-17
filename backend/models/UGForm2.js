import mongoose from "mongoose";

const SignatureSchema = new mongoose.Schema({
  originalName: String,
  filename: String,
  mimetype: String,
  size: Number,
  id: mongoose.Schema.Types.ObjectId,
}, { _id: false });

const FileSchema = new mongoose.Schema({
  originalName: String,
  filename: String,
  mimetype: String,
  size: Number,
  id: mongoose.Schema.Types.ObjectId,
}, { _id: false });

const GuideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeCode: { type: String, required: true },
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: String, required: true },
  class: { type: String },
  div: { type: String },
  branch: { type: String, required: true },
  rollNo: { type: String, required: true },
  mobileNo: { type: String },
}, { _id: false });

const ExpenseSchema = new mongoose.Schema({
  category: { type: String, required: true }, // renamed from "category" to "head" for consistency
  amount: { type: Number, required: true },
  details: { type: String },
}, { _id: false });

const UGForm2Schema = new mongoose.Schema({
  svvNetId: { type: String, required: true },

  projectTitle: { type: String, required: true },
  projectDescription: { type: String, required: true },
  utility: { type: String, required: true },
  receivedFinance: { type: Boolean, required: true },
  financeDetails: {
    type: String,
    required: function () {
      return this.receivedFinance === true;
    },
  },

  guideDetails: {
      type: [GuideSchema],
      default: [],
      validate: v => Array.isArray(v) && v.length > 0
  },

  students: {
    type: [StudentSchema],
    default: [],
    validate: v => Array.isArray(v) && v.length > 0
  },

  expenses: {
    type: [ExpenseSchema],
    default: [],
    validate: v => Array.isArray(v) && v.length > 0
  },

  totalBudget: { type: Number, required: true },

  groupLeaderSignature: {
    type: SignatureSchema,
    required: [true, "Group leader signature file is required."],
  },
  guideSignature: {
    type: SignatureSchema,
    required: [true, "Guide signature file is required."],
  },

  uploadedFiles: {
    type: [FileSchema],
    default: [],
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

const UGForm2 = mongoose.model("UGForm2", UGForm2Schema);
export default UGForm2;
