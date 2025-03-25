const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema({
  svvNetId: {
    type: String,
    required: true, // Ensures SVVNet ID is mandatory
  },
  projectTitle: {
    type: String,
    required: true,
  },
  studentDetails: {
    type: Array,
    required: true,
  },
  documents: [
    {
      filename: String,
      url: String,
    },
  ],
}, { timestamps: true });

const Upload = mongoose.model("Upload", uploadSchema);
module.exports = Upload;
