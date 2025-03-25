import React, { useState, useRef } from "react";
import "./UG1Form.css";

const UG1Form = () => {
  const [formData, setFormData] = useState({
    projectTitle: "",
    projectUtility: "",
    projectDescription: "",
    finance: "",
    guideName: "",
    employeeCode: "",
    amountClaimed: "",
    studentDetails: Array.from({ length: 4 }, () => ({
      srNo: "",
      branch: "",
      yearOfStudy: "",
      studentName: "",
      rollNumber: "",
    })),
  });

  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleInputChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    const svvNetId = localStorage.getItem("svvNetId"); // Retrieve SVVNet ID from localStorage

    if (!svvNetId) {
      alert("❌ SVVNet ID is required before uploading files!");
      return;
    }

    const files = Array.from(event.target.files);
    const validFiles = [];

    files.forEach((file) => {
      if (file.type !== "application/pdf") {
        alert(`❌ ${file.name} is not a PDF file.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`❌ ${file.name} exceeds 5MB size limit.`);
        return;
      }
      validFiles.push(file);
    });

    setUploadedFiles([...uploadedFiles, ...validFiles]);
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
  };

  const handleStudentDetailsChange = (index, field, value) => {
    setFormData((prevState) => {
      const updatedStudents = prevState.studentDetails.map((student, i) =>
        i === index ? { ...student, [field]: value } : student
      );
      return { ...prevState, studentDetails: updatedStudents };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const svvNetId = localStorage.getItem("svvNetId");
  
    if (!svvNetId) {
      alert("❌ SVVNet ID is missing. Please log in.");
      return;
    }
    
    console.log("📌 Stored SVVNet ID:", localStorage.getItem("svvNetId"));

    const formDataToSend = {
      svvNetId, // Ensure this is included
      ...formData,
    };
  
    console.log("📌 Sending Form Data:", formDataToSend); // Debugging
  
    try {
      const response = await fetch("http://localhost:5000/api/ug1form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formDataToSend),
      });
  
      const result = await response.json();
      console.log("📌 Server Response:", result); // Debugging
  
      if (response.ok) {
        alert("✅ Form submitted successfully!");
        setFormData({
          projectTitle: "",
          projectUtility: "",
          projectDescription: "",
          finance: "",
          guideName: "",
          employeeCode: "",
          amountClaimed: "",
          studentDetails: Array(4).fill({
            srNo: "",
            branch: "",
            yearOfStudy: "",
            studentName: "",
            rollNumber: "",
          }),
        });
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      alert("❌ Failed to submit the form.");
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Under Graduate Form 1</h1>
      <p className="form-subtitle">In-house Student Project within Department</p>

      <form onSubmit={handleSubmit}>
        {/* Project Details */}
        <div className="form-field">
          <label>Title of the Project:</label>
          <input type="text" value={formData.projectTitle} onChange={(e) => handleInputChange("projectTitle", e.target.value)} />
        </div>

        <div className="form-field">
          <label>Utility of the Project:</label>
          <input type="text" value={formData.projectUtility} onChange={(e) => handleInputChange("projectUtility", e.target.value)} />
        </div>

        <div className="form-field">
          <label>Description:</label>
          <textarea value={formData.projectDescription} onChange={(e) => handleInputChange("projectDescription", e.target.value)} />
        </div>

        {/* Finance */}
        <div className="form-field">
          <label>Received finance from any other agency:</label>
          <div className="radio-group">
            <label>
              <input type="radio" value="Yes" checked={formData.finance === "Yes"} onChange={() => handleInputChange("finance", "Yes")} />
              Yes
            </label>
            <label>
              <input type="radio" value="No" checked={formData.finance === "No"} onChange={() => handleInputChange("finance", "No")} />
              No
            </label>
          </div>
        </div>

        {/* Guide Info */}
        <div className="form-field">
          <label>Name of the Guide/Co-Guide:</label>
          <input type="text" value={formData.guideName} onChange={(e) => handleInputChange("guideName", e.target.value)} required />

          <label>Employee Code:</label>
          <input type="text" value={formData.employeeCode} onChange={(e) => handleInputChange("employeeCode", e.target.value)} required />
        </div>

        {/* Student Details */}
        <h3 className="table-title">Student Details</h3>
        <table className="student-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Branch</th>
              <th>Year of Study</th>
              <th>Student Name</th>
              <th>Roll Number</th>
            </tr>
          </thead>
          <tbody>
            {formData.studentDetails.map((student, index) => (
              <tr key={index}>
                {["srNo", "branch", "yearOfStudy", "studentName", "rollNumber"].map((field) => (
                  <td key={field}>
                    <input type="text" value={student[field]} onChange={(e) => handleStudentDetailsChange(index, field, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* File Upload */}
        <div className="button-container">
          <div className="upload-section">
            <button type="button" className="upload-btn" onClick={handleButtonClick}>
              Upload List of Parts with Price
            </button>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileUpload}
              className="file-input"
              ref={fileInputRef}
              style={{ display: "none" }}
            />
          </div>

          {/* Signatures */}
          <div className="signature-btns">
            <button type="button">Signature of Group Leader</button>
            <button type="button">Signature of Guide</button>
          </div>

          {/* Amount Claimed */}
          <div className="amount-container">
            <label>Amount Claimed (INR):</label>
            <input type="text" value={formData.amountClaimed} onChange={(e) => handleInputChange("amountClaimed", e.target.value)} />
          </div>

          {/* Submit */}
          <button type="submit" className="submit-btn">Submit</button>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              <h3>Uploaded Documents</h3>
              <ul>
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="file-item">
                    {file.name} <button onClick={() => removeFile(index)}>❌ Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default UG1Form;
