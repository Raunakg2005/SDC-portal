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
    validate: {
      validator: function (arr) {
        return Array.isArray(arr) && arr.length === 4;
      },
      message: 'Authors array must have exactly 4 strings',
    },
    required: true,
  },

  bankDetails: { type: bankDetailsSchema, required: true },

  registrationFee: { type: String, required: true },
  previousClaim: { type: String, enum: ['Yes', 'No'], required: true },
  claimDate: { type: Date },
  amountReceived: { type: String },
  amountSanctioned: { type: String },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under Review'],
    default: 'pending',
  },

  // GridFS File IDs
  paperCopyFilename: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'uploads.files',
  },
  groupLeaderSignatureFilename: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'uploads.files',
  },
  guideSignatureFilename: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'uploads.files',
  },
  additionalDocumentsFilename: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'uploads.files',
    },
  ],
}, {
  timestamps: true,
});

const PG2BForm = mongoose.model("PG2BForm", PG2BFormSchema);

export default PG2BForm;
