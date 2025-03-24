const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  srNo: String,
  branch: String,
  yearOfStudy: String,
  studentName: String,
  rollNumber: String,
});

const UG1FormSchema = new mongoose.Schema({
  userEmail: { type: String, required: true }, // Identify user
  projectTitle: String,
  projectUtility: String,
  projectDescription: String,
  finance: String,
  guideName: String,
  employeeCode: String,
  amountClaimed: String,
  studentDetails: [studentSchema], // Store student details as an array
});

module.exports = mongoose.model("UG1Form", UG1FormSchema);
