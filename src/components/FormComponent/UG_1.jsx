import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/UG1.css";

const UG1Form = ({ data = null, viewOnly = false }) => {
  const [formData, setFormData] = useState({
    projectTitle: data?.projectTitle || "",
    projectUtility: data?.projectUtility || "",
    projectDescription: data?.projectDescription || "",
    finance: data?.finance || "",
    guideName: data?.guideName || "",
    employeeCode: data?.employeeCode || "",
    svvNetId: data?.svvNetId || "",
    studentDetails: data?.studentDetails || Array(4).fill({
      branch: "",
      yearOfStudy: "",
      studentName: "",
      rollNumber: "",
    }),
    status: data?.status || "pending",
  });
  const [pdfFiles, setPdfFiles] = useState(
    data?.pdfFiles?.map((fileName, i) => ({
      name: fileName,
      url: data.pdfFileUrls?.[i] || null,
    })) || []
  );
  
  const [groupLeaderSignature, setGroupLeaderSignature] = useState(
    data?.groupLeaderSignatureUrl
      ? { name: "Group Leader Signature", url: data.groupLeaderSignatureUrl }
      : null
  );
  
  const [guideSignature, setGuideSignature] = useState(
    data?.guideSignatureUrl
      ? { name: "Guide Signature", url: data.guideSignatureUrl }
      : null
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [formId, setFormId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const svvNetIdRef = useRef("");

  useEffect(() => {
    const storedSvvNetId = localStorage.getItem("svvNetId");
    if (storedSvvNetId) {
      svvNetIdRef.current = storedSvvNetId;
    }
  }, []);

  useEffect(() => {
    if (data) {
      setFormData({
        projectTitle: data.projectTitle || "",
        projectUtility: data.projectUtility || "",
        projectDescription: data.projectDescription || "",
        finance: data.finance || "",
        guideName: data.guideName || "",
        employeeCode: data.employeeCode || "",
        svvNetId: data.svvNetId || "",
        studentDetails: data.studentDetails || Array(4).fill({
          branch: "",
          yearOfStudy: "",
          studentName: "",
          rollNumber: "",
        }),
        status: data.status || "pending",
      });
  
      setPdfFiles(
        data.pdfFiles?.map((fileName, i) => ({
          name: fileName,
          url: data.pdfFileUrls?.[i] || null,
        })) || []
      );
  
      setGroupLeaderSignature(
        data.groupLeaderSignatureUrl
          ? { name: "Group Leader Signature", url: data.groupLeaderSignatureUrl }
          : null
      );
  
      setGuideSignature(
        data.guideSignatureUrl
          ? { name: "Guide Signature", url: data.guideSignatureUrl }
          : null
      );
    }
  }, [data]);

  // Handle text input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle student details input change
  const handleStudentDetailsChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedStudents = [...prev.studentDetails];
      updatedStudents[index] = { ...updatedStudents[index], [field]: value };
      return { ...prev, studentDetails: updatedStudents };
    });
  };

  // Handle Finance Option Selection
  const handleRadioChange = (value) => {
    setFormData((prev) => ({ ...prev, finance: value }));
  };

  const handleFileUpload = (e) => {
    if (viewOnly) return;
    const files = Array.from(e.target.files);
    const validFiles = [];
    const existingFileNames = new Set(pdfFiles.map((file) => file.name)); // Prevent duplicates

    files.forEach((file) => {
      if (file.type !== "application/pdf") {
        alert("❌ Only PDF files are allowed.");
      } else if (file.size > 5 * 1024 * 1024) {
        alert("❌ File must be less than 5MB.");
      } else if (existingFileNames.has(file.name)) {
        alert("❌ File already selected.");
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length) {
      setPdfFiles((prev) => [...prev, ...validFiles]);
    }

    // Reset file input to allow uploading same file again if removed
    e.target.value = null;
  };

  // Remove a selected file
  const removeFile = (index) => {
    if (viewOnly) return;
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Signature Upload
  const handleSignatureUpload = (e, type) => {
    if (viewOnly) return;
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "image/jpeg") {
      alert("❌ Only JPEG images are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("❌ File must be less than 2MB.");
      return;
    }

    if (type === "groupLeader") {
      setGroupLeaderSignature(file);
    } else if (type === "guide") {
      setGuideSignature(file);
    }
  };

  // Upload Signature to Backend
  const uploadSignature = async (file, type, id) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/ug1form/uploadSignature/${id}/${type}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log(`✅ ${type} Signature Uploaded:`, response.data);
    } catch (error) {
      console.error(`❌ Error uploading ${type} signature:`, error);
      throw error;
    }
  };

  // Upload all PDFs sequentially
  const handleUploadPDFs = async (formId) => {
    try {
      for (const file of pdfFiles) {
        const formData = new FormData();
        formData.append("pdfFile", file);

        await axios.post(`http://localhost:5000/api/ug1form/uploadPdf/${formId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        console.log(`PDF ${file.name} uploaded successfully!`);
      }
    } catch (error) {
      console.error("PDF Upload error:", error);
      throw error;
    }
  };

  // Save Form Data
  const handleSaveFormData = async () => {
    setErrorMessage("");
  
    // Basic field validation
    if (
      !formData.projectTitle.trim() ||
      !formData.projectUtility.trim() ||
      !formData.projectDescription.trim() ||
      !formData.guideName.trim()
    ) {
      setErrorMessage("Please fill all required fields.");
      return null;
    }
  
    // Validate student details
    const hasValidStudent = formData.studentDetails.some((student, idx) => {
      const { studentName, rollNumber, branch, yearOfStudy } = student;
  
      // If any field is filled, all must be valid
      if (studentName || rollNumber || branch || yearOfStudy) {
        if (!studentName.trim() || !rollNumber.trim() || !branch.trim() || !yearOfStudy.trim()) {
          setErrorMessage(`Please complete all fields for student ${idx + 1}.`);
          return false;
        }
  
        // Check roll number format
        if (!/^\d{11}$/.test(rollNumber)) {
          setErrorMessage(`Roll Number for student ${idx + 1} must be exactly 11 digits.`);
          return false;
        }
  
        return true;
      }
  
      return false;
    });
  
    if (!hasValidStudent) {
      setErrorMessage("At least one student's complete details must be filled correctly.");
      return null;
    }
  
    // Check PDF files' size
    for (let file of pdfFiles) {
      if (file.size && file.size > 5 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" exceeds the 5MB size limit.`);
        return null;
      }
    }
  
    // Signatures validation
    if (!groupLeaderSignature || (groupLeaderSignature && !groupLeaderSignature.url && !groupLeaderSignature.name)) {
      setErrorMessage("Please upload the Group Leader's signature.");
      return null;
    }
  
    if (!guideSignature || (guideSignature && !guideSignature.url && !guideSignature.name)) {
      setErrorMessage("Please upload the Guide's signature.");
      return null;
    }
  
    try {
      const dataToSend = { ...formData, svvNetId: svvNetIdRef.current };
      const response = await axios.post("http://localhost:5000/api/ug1form/saveFormData", dataToSend);
      if (response.data.formId) {
        setFormId(response.data.formId);
        alert("✅ Form data saved successfully!");
        return response.data.formId;
      } else {
        setErrorMessage("Failed to get form ID. Try again.");
        return null;
      }
    } catch (error) {
      console.error("❌ Error Saving Form Data:", error);
      setErrorMessage("Error saving form data. Try again.");
      return null;
    }
  };
  

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly || isSubmitting) return; // Prevent double submit

    setIsSubmitting(true);
    try {
      const savedFormId = await handleSaveFormData();

      if (!savedFormId) {
        setIsSubmitting(false);
        return;
      }

      // Upload PDFs if any
      if (pdfFiles.length > 0) {
        await handleUploadPDFs(savedFormId);
      }

      // Upload signatures if present
      if (groupLeaderSignature) {
        await uploadSignature(groupLeaderSignature, "groupLeader", savedFormId);
      }
      if (guideSignature) {
        await uploadSignature(guideSignature, "guide", savedFormId);
      }
      alert("✅ Form submitted successfully!");
    } catch (error) {
      setErrorMessage("An error occurred during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="form-container">
      <h2>Under Graduate Form 1</h2>
      <p className="form-category">In-house Student Project within Department</p>
  
      {errorMessage && <p className="error">{errorMessage}</p>}
  
      <form onSubmit={handleSubmit}>
        <label>Title of the Project:</label>
        <input
          type="text"
          value={formData.projectTitle}
          onChange={(e) => handleInputChange("projectTitle", e.target.value)}
          disabled={viewOnly}
          required
        />
  
        <label>Utility of the Project:</label>
        <input
          type="text"
          value={formData.projectUtility}
          onChange={(e) => handleInputChange("projectUtility", e.target.value)}
          disabled={viewOnly}
          required
        />
  
        <label>Description:</label>
        <textarea
          value={formData.projectDescription}
          onChange={(e) => handleInputChange("projectDescription", e.target.value)}
          disabled={viewOnly}
          required
        />
  
        <label>Whether received finance from any other agency:</label>
        <div className="form-group">
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="finance"
                value="Yes"
                checked={formData.finance === "Yes"}
                onChange={() => handleRadioChange("Yes")}
                disabled={viewOnly}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="finance"
                value="No"
                checked={formData.finance === "No"}
                onChange={() => handleRadioChange("No")}
                disabled={viewOnly}
              />
              No
            </label>
          </div>
        </div>
  
        <div className="guide-details">
          <div>
            <label>Name of the Guide/Co-Guide:</label>
            <input
              type="text"
              value={formData.guideName}
              onChange={(e) => handleInputChange("guideName", e.target.value)}
              disabled={viewOnly}
              required
            />
          </div>
          <div>
            <label>Employee Code:</label>
            <input
              type="text"
              value={formData.employeeCode}
              onChange={(e) => handleInputChange("employeeCode", e.target.value)}
              disabled={viewOnly}
            />
          </div>
        </div>
  
        {/* Student Details Table */}
        <h3>Student Details</h3>
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
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    value={student.branch}
                    onChange={(e) => handleStudentDetailsChange(index, "branch", e.target.value)}
                    disabled={viewOnly}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={student.yearOfStudy}
                    onChange={(e) => handleStudentDetailsChange(index, "yearOfStudy", e.target.value)}
                    disabled={viewOnly}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={student.studentName}
                    onChange={(e) => handleStudentDetailsChange(index, "studentName", e.target.value)}
                    disabled={viewOnly}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={student.rollNumber}
                    onChange={(e) => handleStudentDetailsChange(index, "rollNumber", e.target.value)}
                    disabled={viewOnly}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  
        <div className="signatures">
          <div>
            <label>Signature of Group Leader (JPEG Only)</label>
            {!viewOnly && (
              <input
                type="file"
                accept="image/jpeg"
                name="groupLeaderSignature"
                onChange={(e) => handleSignatureUpload(e, "groupLeader")}
              />
            )}
            {groupLeaderSignature &&
              (viewOnly && groupLeaderSignature.url ? (
                <a href={groupLeaderSignature.url} target="_blank" rel="noopener noreferrer">
                  View Signature
                </a>
              ) : (
                <p className="file-name">{groupLeaderSignature.name}</p>
              ))}
          </div>
  
          <div>
            <label>Signature of Guide (JPEG Only)</label>
            {!viewOnly && (
              <input
                type="file"
                accept="image/jpeg"
                name="guideSignature"
                onChange={(e) => handleSignatureUpload(e, "guide")}
              />
            )}
            {guideSignature &&
              (viewOnly && guideSignature.url ? (
                <a href={guideSignature.url} target="_blank" rel="noopener noreferrer">
                  View Signature
                </a>
              ) : (
                <p className="file-name">{guideSignature.name}</p>
              ))}
          </div>
        </div>
  
        <div className="form-group">
          <label>Upload Supporting Documents (PDF):</label>
          {!viewOnly && (
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              multiple
            />
          )}
          <ul className="file-list">
            {pdfFiles.map((file, index) => (
              <li key={index}>
                {file.url ? (
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                ) : (
                  file.name
                )}
                {!viewOnly && (
                  <button type="button" onClick={() => removeFile(index)}>
                    ❌ Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
  
        <div className="form-actions">
          <button type="button" className="back-btn" onClick={handleBack} disabled={isSubmitting}>
            Back
          </button>
          {!viewOnly && (
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
export default UG1Form;
