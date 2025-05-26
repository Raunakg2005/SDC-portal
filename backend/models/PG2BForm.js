import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema({
  beneficiary: { type: String, required: true },
  ifsc: { type: String, required: true },
  bankName: { type: String, required: true },
  branch: { type: String, required: true },
  accountType: { type: String, required: true },
  accountNumber: { type: String, required: true },
});

const PG2BFormSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  yearOfAdmission: { type: String, required: true },
  feesPaid: { type: String, enum: ['Yes', 'No'], required: true },
  projectTitle: { type: String, required: true },
  guideName: { type: String, required: true },
  coGuideName: { type: String },
  conferenceDate: { type: Date, required: true },
  organization: { type: String, required: true },
  publisher: { type: String, required: true },
  paperLink: { type: String },
  authors: { 
    type: [String], 
    validate: [arr => arr.length === 4, 'Authors array must have exactly 4 strings'], 
    required: true 
  },
  bankDetails: { type: bankDetailsSchema, required: true },

  registrationFee: { type: String, required: true },
  previousClaim: { type: String, enum: ['Yes', 'No'], required: true },
  claimDate: { type: Date },
  amountReceived: { type: String },
  amountSanctioned: { type: String },
  status: { type: String, default: 'pending' },

  // Store GridFS file IDs here:
  paperCopyFilename: { type: mongoose.Schema.Types.ObjectId, required: true },
  groupLeaderSignatureFilename: { type: mongoose.Schema.Types.ObjectId, required: true },
  guideSignatureFilename: { type: mongoose.Schema.Types.ObjectId, required: true },
  additionalDocumentsFilename: [{ type: mongoose.Schema.Types.ObjectId }], // array of ObjectIds, optional

}, { timestamps: true });

const PG2BForm = mongoose.model("PG2BForm", PG2BFormSchema);

export default PG2BForm;
