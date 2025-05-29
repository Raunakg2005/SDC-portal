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

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: String, required: true }, // Added 'year' field
  class: { type: String },
  div: { type: String },
  branch: { type: String, required: true }, // Added 'branch' field
  rollNo: { type: String, required: true, unique: false }, // unique: true might cause issues if roll numbers are not globally unique across all forms
  mobileNo: { type: String },
});

const ExpenseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  details: { type: String }, // Added 'details' field
}, { _id: false });

const UGForm2Schema = new mongoose.Schema({
  projectTitle: { type: String, required: true },
  projectDescription: { type: String, required: true },
  utility: { type: String, required: true },
  receivedFinance: { type: Boolean, required: true },
  financeDetails: {
    type: String,
    required: function() { return this.receivedFinance === true; }, // Conditionally required
  },
  guideName: { type: String, required: true },
  employeeCode: { type: String, required: true },
  students: [StudentSchema],
  expenses: [ExpenseSchema],
  totalBudget: { type: Number, required: true },
  groupLeaderSignature: {
    type: SignatureSchema,
    required: [true, 'Group leader signature file is required.'],
  },
  guideSignature: {
    type: SignatureSchema,
    required: [true, 'Guide signature file is required.'],
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  uploadedFiles: [FileSchema],
}, { timestamps: true });

const UGForm2 = mongoose.model("UGForm2", UGForm2Schema);

export default UGForm2;
