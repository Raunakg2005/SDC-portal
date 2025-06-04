import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/UG2.css";

const UGForm2 = ({ viewOnly = false, data = null }) => {
  const [formData, setFormData] = useState(() => {
    if (viewOnly && data) {
      return {
        projectTitle: data.projectTitle || "",
        projectDescription: data.projectDescription || "",
        utility: data.utility || "",
        receivedFinance: data.receivedFinance || false,
        financeDetails: data.financeDetails || "",
        guideName: data.guideName || "",
        guideEmployeeCode: data.employeeCode || "",
        students: data.students || [],
        expenses: data.expenses || [],
        totalBudget: data.totalBudget || "",
        groupLeaderSignature: data.groupLeaderSignature || null,
        guideSignature: data.guideSignature || null,
        uploadedFiles: data.uploadedFiles || [],
        errorMessage: "",
        status: data.status || "pending",
        errors: {},
      };
    } else {
      return {
        projectTitle: "",
        projectDescription: "",
        utility: "",
        receivedFinance: false,
        financeDetails: "",
        guideName: "",
        guideEmployeeCode: "",
        students: [],
        expenses: [],
        totalBudget: "",
        groupLeaderSignature: null,
        guideSignature: null,
        uploadedFiles: [],
        status: "pending",
        errorMessage: "",
        errors: {},
      };
    }
  });

  useEffect(() => {
    if (viewOnly && data) {
      setFormData({
        projectTitle: data.projectTitle || "",
        projectDescription: data.projectDescription || "",
        utility: data.utility || "",
        receivedFinance: data.receivedFinance || false,
        financeDetails: data.financeDetails || "",
        guideName: data.guideName || "",
        guideEmployeeCode: data.employeeCode || "",
        students: data.students || [],
        expenses: data.expenses || [],
        totalBudget: data.totalBudget || "",
        groupLeaderSignature: data.groupLeaderSignature || null,
        guideSignature: data.guideSignature || null,
        uploadedFiles: data.uploadedFiles || [],
        errorMessage: "",
        status: "pending",
        errors: {},
      });
    }
  }, [data, viewOnly]);

  const validateForm = () => {
    let errors = {};

    if (!formData.projectTitle.trim())
      errors.projectTitle = "Project title is required.";
    if (!formData.projectDescription.trim())
      errors.projectDescription = "Project description is required.";
    if (!formData.utility.trim()) errors.utility = "Utility is required.";
    if (formData.receivedFinance && !formData.financeDetails.trim()) {
      errors.financeDetails = "Finance details are required if finance received.";
    }
    if (!formData.guideName.trim()) errors.guideName = "Guide name is required.";
    if (!formData.guideEmployeeCode.trim())
      errors.guideEmployeeCode = "Guide employee code is required.";

    if (formData.students.length === 0) {
      errors.students = "At least one student is required.";
    } else {
      formData.students.forEach((student, idx) => {
        if (!student.name.trim())
          errors[`studentName_${idx}`] = "Student name is required.";
        if (!student.year.trim())
          errors[`studentYear_${idx}`] = "Year of study is required.";
        if (!student.class.trim())
          errors[`studentClass_${idx}`] = "Class is required.";
        if (!student.div.trim()) errors[`studentDiv_${idx}`] = "Div is required.";
        if (!student.branch.trim())
          errors[`studentBranch_${idx}`] = "Branch is required.";
        if (!student.rollNo.trim())
          errors[`studentRollNo_${idx}`] = "Roll No. is required.";
        if (!student.mobileNo.trim()) {
          errors[`studentMobileNo_${idx}`] = "Mobile No. is required.";
        } else if (!/^\d{10}$/.test(student.mobileNo.trim())) {
          errors[`studentMobileNo_${idx}`] = "Mobile No. must be 10 digits.";
        }
      });
    }

    formData.expenses.forEach((expense, idx) => {
      if (!expense.category.trim())
        errors[`expenseCategory_${idx}`] = "Category is required.";
      if (!expense.amount.trim())
        errors[`expenseAmount_${idx}`] = "Amount is required.";
      else if (isNaN(expense.amount) || Number(expense.amount) <= 0)
        errors[`expenseAmount_${idx}`] = "Amount must be a positive number.";
    });

    if (!formData.totalBudget.trim())
      errors.totalBudget = "Total budget is required.";
    else if (isNaN(formData.totalBudget) || Number(formData.totalBudget) <= 0)
      errors.totalBudget = "Total budget must be a positive number.";

    if (!viewOnly) {
      if (!formData.groupLeaderSignature) {
        errors.groupLeaderSignature = "Group leader signature is required.";
      } else if (
        formData.groupLeaderSignature.type &&
        formData.groupLeaderSignature.type !== "image/jpeg"
      ) {
        errors.groupLeaderSignature = "Group leader signature must be a JPEG image.";
      } else if (
        formData.groupLeaderSignature.size &&
        formData.groupLeaderSignature.size > 5 * 1024 * 1024
      ) {
        errors.groupLeaderSignature = "Group leader signature must be under 5MB.";
      }

      const isValidSignature = (sig) => {
        if (!sig) return false;
        if (sig instanceof File) {
          return sig.type === "image/jpeg" && sig.size <= 5 * 1024 * 1024;
        }
        return sig.url || sig.name; // assumes already uploaded
      };
      
      if (!isValidSignature(formData.groupLeaderSignature)) {
        errors.groupLeaderSignature = "Group leader signature is required and must be a JPEG under 5MB.";
      }
      
      if (!isValidSignature(formData.guideSignature)) {
        errors.guideSignature = "Guide signature is required and must be a JPEG under 5MB.";
      }

      if (formData.uploadedFiles.length === 0) {
        errors.uploadedFiles = "At least one additional document is required.";
      } else if (formData.uploadedFiles.length <= 5) {
        formData.uploadedFiles.forEach((file, idx) => {
          if (!file.type || file.type !== "application/pdf") {
            errors[`uploadedFile_${idx}`] = `File "${file.name}" must be a PDF.`;
          }
          if (!file.size || file.size > 5 * 1024 * 1024) {
            errors[`uploadedFile_${idx}`] = `File "${file.name}" must be under 5MB.`;
          }
        });
      } else {
        // More than 5 files uploaded
        if (formData.uploadedFiles.length !== 1) {
          errors.uploadedFiles = "If more than 5 files, you must upload exactly one ZIP archive.";
        } else {
          const file = formData.uploadedFiles[0];
          const isZip =
            file.type === "application/zip" ||
            file.type === "application/x-zip-compressed" ||
            file.name.endsWith(".zip");
          const isUnder25MB = file.size <= 25 * 1024 * 1024;

          if (!isZip) {
            errors.uploadedFiles = "If more than 5 files, the single uploaded file must be a ZIP archive.";
          }
          if (!isUnder25MB) {
            errors.uploadedFiles = "ZIP file must be under 25MB.";
          }
        }
      }
    }

    setFormData((prev) => ({ ...prev, errors }));

    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
      errors: { ...formData.errors, [name]: null },
    });
  };

  const updateStudentField = (e, index, field) => {
    const updatedStudents = [...formData.students];
    updatedStudents[index][field] = e.target.value;
    setFormData({ ...formData, students: updatedStudents });
  };

  const removeStudentRow = (index) => {
    const updatedStudents = [...formData.students];
    updatedStudents.splice(index, 1);
    setFormData({ ...formData, students: updatedStudents });
  };

  const updateExpenseField = (e, index, field) => {
    const updatedExpenses = [...formData.expenses];
    updatedExpenses[index][field] = e.target.value;
    setFormData({ ...formData, expenses: updatedExpenses });
  };

  const removeExpenseRow = (index) => {
    const updatedExpenses = [...formData.expenses];
    updatedExpenses.splice(index, 1);
    setFormData({ ...formData, expenses: updatedExpenses });
  };

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const errors = {};
    const updatedFiles = [];
    let zipFound = false;

    selectedFiles.forEach((file, index) => {
      const isPDF = file.type === "application/pdf";
      const isZIP =
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed" ||
        file.name.endsWith(".zip");

      if (isPDF) {
        if (file.size > 5 * 1024 * 1024) {
          errors[`file_${index}`] = `${file.name} exceeds 5MB size limit.`;
        } else {
          updatedFiles.push(file);
        }
      } else if (isZIP) {
        if (file.size > 25 * 1024 * 1024) {
          errors[`file_${index}`] = `${file.name} exceeds 25MB size limit.`;
        } else {
          updatedFiles.push(file);
          zipFound = true;
        }
      } else {
        errors[`file_${index}`] = `${file.name} is not a valid PDF or ZIP file.`;
      }
    });

    if (!viewOnly) {
      if (zipFound && updatedFiles.length > 1) {
        errors.uploadedFiles = "If uploading a ZIP file, only one ZIP archive is allowed.";
      }
      if (!zipFound && updatedFiles.length > 5) {
        errors.uploadedFiles = "You can upload up to 5 PDF files or a single ZIP file.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormData((prev) => ({
        ...prev,
        errorMessage: "Please fix file upload errors before submitting.",
        errors: { ...prev.errors, ...errors },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        uploadedFiles: updatedFiles,
        errorMessage: "",
        errors: { ...prev.errors, uploadedFiles: null },
      }));
    }
  };

  const handleGroupLeaderSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        groupLeaderSignature: file,
        errors: { ...prev.errors, groupLeaderSignature: null },
      }));
    }
  };
  
  const handleGuideSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        guideSignature: file,
        errors: { ...prev.errors, guideSignature: null },
      }));
    }
  };
  
  const addStudentRow = () => {
    setFormData({
      ...formData,
      students: [
        ...formData.students,
        { name: "", year: "", class: "", div: "", branch: "", rollNo: "", mobileNo: "" },
      ],
    });
  };

  const addExpenseRow = () => {
    setFormData({
      ...formData,
      expenses: [...formData.expenses, { category: "", amount: "" }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please fix the errors in the form.");
      return;
    }
    try {
      const formPayload = new FormData();

      // Append all text/json fields
      formPayload.append("projectTitle", formData.projectTitle);
      formPayload.append("projectDescription", formData.projectDescription);
      formPayload.append("utility", formData.utility);
      formPayload.append("receivedFinance", formData.receivedFinance);
      formPayload.append("financeDetails", formData.financeDetails);
      formPayload.append("guideName", formData.guideName);
      formPayload.append("guideEmployeeCode", formData.guideEmployeeCode);
      formPayload.append("totalBudget", formData.totalBudget);

      // Append arrays as JSON strings
      formPayload.append("students", JSON.stringify(formData.students));
      formPayload.append("expenses", JSON.stringify(formData.expenses));
      formPayload.append("status", formData.status);

      // Append file inputs (only if they are File objects, not URL objects from view mode)
      if (formData.groupLeaderSignature instanceof File) {
        formPayload.append("groupLeaderSignature", formData.groupLeaderSignature);
      }
      if (formData.guideSignature instanceof File) {
        formPayload.append("guideSignature", formData.guideSignature);
      }

      // Append multiple uploaded files with the same key (only if they are File objects)
      if (Array.isArray(formData.uploadedFiles)) {
        formData.uploadedFiles.forEach(file => {
          if (file instanceof File) {
            formPayload.append("uploadedFiles", file);
          }
        });
      }
      const response = await axios.post(
        "http://localhost:5000/api/ug2form/saveFormData",
        formPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200 || response.status === 201) {
        alert("Form submitted successfully! Submission ID: ${response.data.id}");
        // Optionally clear form or redirect to view the newly created submission
        //setFormData(initialState);
      } else {
        console.error("❌ Submission Failed:", response.data);
        alert("Error: " + (response.data.message || "Something went wrong"));
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
          console.error("Response headers:", error.response.headers);
          alert("Submission failed! " + (error.response.data.message || "Server responded with an error."));
      } else if (error.request) {
          console.error("Request data:", error.request);
          alert("Submission failed! No response from server. Check network connection.");
      } else {
          console.error("Error message:", error.message);
          alert("Submission failed! An error occurred before sending the request.");
      }
    }
  };
  return (
    <div className="form-container">
      <h2>Under Graduate Form 2</h2>
      {viewOnly && data && data.id && <p className="submission-id">Submission ID: {data.id}</p>}
      <p className="form-category">Interdisciplinary Projects (FY to LY Students)</p>
      <form onSubmit={handleSubmit}>
        <label>Title of Proposed Project:</label>
        <input
          type="text"
          name="projectTitle"
          value={formData.projectTitle}
          disabled={viewOnly}
          onChange={handleInputChange}
        />
        {formData.errors.projectTitle && <p className="error-message">{formData.errors.projectTitle}</p>}

        <label>Brief Description of Proposed Work:</label>
        <textarea
          name="projectDescription"
          disabled={viewOnly}
          placeholder="Attach a separate sheet if required"
          value={formData.projectDescription}
          onChange={handleInputChange}
        />
        {formData.errors.projectDescription && <p className="error-message">{formData.errors.projectDescription}</p>}

        <label>Utility:</label>
        <input
          type="text"
          name="utility"
          disabled={viewOnly}
          value={formData.utility}
          onChange={handleInputChange}
        />
        {formData.errors.utility && <p className="error-message">{formData.errors.utility}</p>}

        <label>Whether received finance from any other agency:</label>
        <div className="checkbox-group">
          <input
            type="radio"
            id="yes"
            name="receivedFinance"
            checked={formData.receivedFinance === true}
            onChange={() => setFormData({ ...formData, receivedFinance: true, errors: { ...formData.errors, financeDetails: null } })}
            disabled={viewOnly}
          />
          <label htmlFor="yes">Yes</label>

          <input
            type="radio"
            id="no"
            name="receivedFinance"
            checked={formData.receivedFinance === false}
            onChange={() => setFormData({ ...formData, receivedFinance: false, errors: { ...formData.errors, financeDetails: null } })}
            disabled={viewOnly}
          />
          <label htmlFor="no">No</label>
        </div>

        <label>Details if Yes:</label>
        <textarea
          name="financeDetails"
          disabled={viewOnly || !formData.receivedFinance}
          value={formData.financeDetails}
          onChange={handleInputChange}
        />
        {formData.errors.financeDetails && <p className="error-message">{formData.errors.financeDetails}</p>}

        <div className="guide-details">
          <div>
            <label>Name of the Guide/Co-Guide:</label>
            <input
              type="text"
              disabled={viewOnly}
              name="guideName"
              value={formData.guideName}
              onChange={handleInputChange}
            />
            {formData.errors.guideName && <p className="error-message">{formData.errors.guideName}</p>}
          </div>
          <div>
            <label>Employee Code:</label>
            <input
              type="text"
              disabled={viewOnly}
              name="guideEmployeeCode"
              value={formData.guideEmployeeCode}
              onChange={handleInputChange}
            />
            {formData.errors.guideEmployeeCode && <p className="error-message">{formData.errors.guideEmployeeCode}</p>}
          </div>
        </div>

        <table className="student-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Name of Student</th>
              <th>Year Of Study</th>
              <th>Class</th>
              <th>Div</th>
              <th>Branch</th>
              <th>Roll No.</th>
              <th>Mobile No.</th>
              {!viewOnly && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {formData.students.map((student, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    value={student.name}
                    onChange={(e) => updateStudentField(e, index, "name")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`studentName_${index}`] && (
                    <p className="error-message">{formData.errors[`studentName_${index}`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={student.year}
                    onChange={(e) => updateStudentField(e, index, "year")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`studentYear_${index}`] && (
                    <p className="error-message">{formData.errors[`studentYear_${index}`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={student.class}
                    onChange={(e) => updateStudentField(e, index, "class")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`studentClass_${index}`] && (
                    <p className="error-message">{formData.errors[`studentClass_${index}`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={student.div}
                    onChange={(e) => updateStudentField(e, index, "div")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`studentDiv_${index}`] && (
                    <p className="error-message">{formData.errors[`studentDiv_${index}`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={student.branch}
                    onChange={(e) => updateStudentField(e, index, "branch")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`studentBranch_${index}`] && (
                    <p className="error-message">{formData.errors[`studentBranch_${index}`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={student.rollNo}
                    onChange={(e) => updateStudentField(e, index, "rollNo")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`studentRollNo_${index}`] && (
                    <p className="error-message">{formData.errors[`studentRollNo_${index}`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={student.mobileNo}
                    onChange={(e) => updateStudentField(e, index, "mobileNo")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`studentMobileNo_${index}`] && (
                    <p className="error-message">{formData.errors[`studentMobileNo_${index}`]}</p>
                  )}
                </td>
                {!viewOnly && (
                    <td>
                        <button type="button" className="remove-btn" onClick={() => removeStudentRow(index)}>
                        ❌
                        </button>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {formData.errors.students && <p className="error-message">{formData.errors.students}</p>}
        {!viewOnly && (
          <button type="button" className="add-btn" onClick={addStudentRow}>
            ➕ Add More Student
          </button>
        )}

        <table className="budget-table">
          <thead>
            <tr>
              <th>Expense Category</th>
              <th>Amount</th>
              <th>Details</th>
              {!viewOnly && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {formData.expenses.map((expense, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={expense.category}
                    onChange={(e) => updateExpenseField(e, index, "category")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`expenseCategory_${index}`] && (
                    <p className="error-message">{formData.errors[`expenseCategory_${index}`]}</p>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={expense.amount}
                    onChange={(e) => updateExpenseField(e, index, "amount")}
                    disabled={viewOnly}
                  />
                  {!viewOnly && formData.errors[`expenseAmount_${index}`] && (
                    <p className="error-message">{formData.errors[`expenseAmount_${index}`]}</p>
                  )}
                </td>
                <td>
                  <textarea
                    value={expense.details}
                    onChange={(e) => updateExpenseField(e, index, "details")}
                    disabled={viewOnly}
                  />
                </td>
                {!viewOnly && (
                    <td>
                        <button type="button" className="remove-btn" onClick={() => removeExpenseRow(index)}>
                        ❌
                        </button>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!viewOnly && (
          <button type="button" className="add-btn" onClick={addExpenseRow}>
            ➕ Add More Expense
          </button>
        )}

        <label>Total Budget (Including Contingency Amount):</label>
        <input
          type="text"
          disabled={viewOnly}
          name="totalBudget"
          value={formData.totalBudget}
          onChange={handleInputChange}
        />
        {formData.errors.totalBudget && <p className="error-message">{formData.errors.totalBudget}</p>}

        {/* Signatures */}
      <div className="signatures">
        <div>
          <label>Signature of Group Leader (JPEG Only)</label>
          {!viewOnly && (
            <input
              type="file"
              accept=".jpeg,.jpg,image/jpeg,image/jpg"
              name="groupLeaderSignature"
              onChange={handleGroupLeaderSignatureUpload}
              disabled={viewOnly}
            />
          )}
          {viewOnly && formData.groupLeaderSignature?.url ? (
            <img
              src={formData.groupLeaderSignature.url}
              alt="Group Leader Signature"
              className="signature-display"
            />
          ) : formData.groupLeaderSignature?.name ? (
            <p className="file-name">{formData.groupLeaderSignature.name}</p>
          ) : null}
          {!viewOnly && formData.errors.groupLeaderSignature && (
            <p className="error-message">{formData.errors.groupLeaderSignature}</p>
          )}
        </div>

        <div>
          <label>Signature of Guide (JPEG Only)</label>
          {!viewOnly && (
            <input
              type="file"
              accept=".jpeg,.jpg,image/jpeg,image/jpg"
              name="guideSignature"
              onChange={handleGuideSignatureUpload}
              disabled={viewOnly}
            />
          )}
          {viewOnly && formData.guideSignature?.url ? (
            <img
              src={formData.guideSignature.url}
              alt="Guide Signature"
              className="signature-display"
            />
          ) : formData.guideSignature?.name ? (
            <p className="file-name">{formData.guideSignature.name}</p>
          ) : null}
          {!viewOnly && formData.errors.guideSignature && (
            <p className="error-message">{formData.errors.guideSignature}</p>
          )}
        </div>
      </div>
        <label>
          Upload Additional Documents (Max 5 PDF files, 5MB each OR one ZIP file up to 25MB):
        </label>
        {!viewOnly && (
          <input
            type="file"
            accept=".pdf, application/pdf, .zip, application/zip, application/x-zip-compressed"
            multiple
            name="uploadedFiles"
            onChange={handleFileUpload}
            disabled={viewOnly}
          />
        )}
        {formData.uploadedFiles.length > 0 && (
          <div className="uploaded-files-list">
            <h4>Uploaded Files:</h4>
            <ul>
              {formData.uploadedFiles.map((file, index) => (
                <li key={index}>
                  {viewOnly && file.url ? (
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                          {file.originalName} ({file.mimetype}, {(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </a>
                  ) : (
                      <>
                          {file.name || file.originalName} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                          {!viewOnly && (
                              <button
                                  type="button"
                                  className="remove-file-btn"
                                  onClick={() => removeUploadedFile(index)}
                              >
                                  ❌
                              </button>
                          )}
                      </>
                  )}
                  {!viewOnly && formData.errors[`uploadedFile_${index}`] && (
                    <p className="error-message">
                      {formData.errors[`uploadedFile_${index}`]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* General error for uploadedFiles (e.g., if more than 5 files are not a single zip) */}
        {!viewOnly && formData.errors.uploadedFiles && <p className="error-message">{formData.errors.uploadedFiles}</p>}

        {!viewOnly && (
          <button type="submit" className="submit-btn">
            Submit
          </button>
        )}
      </form>
    </div>
  );
};

export default UGForm2;