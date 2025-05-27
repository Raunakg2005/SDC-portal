import React, { useState } from "react";

const UGForm2 = ({ viewOnly = false, data = null }) => {
  const [formData, setFormData] = useState(() => {
    return data
      ? {
          projectTitle: data.projectTitle || "",
          projectDescription: data.projectDescription || "",
          utility: data.projectUtility || "",
          receivedFinance: data.receivedFinance || false,
          financeDetails: data.finance || "",
          guideName: data.guideName || "",
          guideEmployeeCode: data.employeeCode || "",
          students: data.students || [],
          expenses: data.expenses || [],
          totalBudget: data.amountClaimed || "",
          groupLeaderSignature: null,
          guideSignature: null,
          uploadedFile: null,
          errorMessage: "",
          errors: {}, // For field-specific errors
        }
      : {
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
          uploadedFile: null,
          errorMessage: "",
          errors: {},
        };
  });

  // Validation function
  const validateForm = () => {
    let errors = {};

    // Required text fields
    if (!formData.projectTitle.trim()) errors.projectTitle = "Project title is required.";
    if (!formData.projectDescription.trim()) errors.projectDescription = "Project description is required.";
    if (!formData.utility.trim()) errors.utility = "Utility is required.";

    // Finance details required if receivedFinance is true
    if (formData.receivedFinance && !formData.financeDetails.trim()) {
      errors.financeDetails = "Finance details are required if finance received.";
    }

    // Guide details
    if (!formData.guideName.trim()) errors.guideName = "Guide name is required.";
    if (!formData.guideEmployeeCode.trim()) errors.guideEmployeeCode = "Guide employee code is required.";

    // Students validation
    if (formData.students.length === 0) {
      errors.students = "At least one student is required.";
    } else {
      formData.students.forEach((student, idx) => {
        if (!student.name.trim()) {
          errors[`studentName_${idx}`] = "Student name is required.";
        }
        if (!student.year.trim()) {
          errors[`studentYear_${idx}`] = "Year of study is required.";
        }
        if (!student.class.trim()) {
          errors[`studentClass_${idx}`] = "Class is required.";
        }
        if (!student.div.trim()) {
          errors[`studentDiv_${idx}`] = "Div is required.";
        }
        if (!student.branch.trim()) {
          errors[`studentBranch_${idx}`] = "Branch is required.";
        }
        if (!student.rollNo.trim()) {
          errors[`studentRollNo_${idx}`] = "Roll No. is required.";
        }
        if (!student.mobileNo.trim()) {
          errors[`studentMobileNo_${idx}`] = "Mobile No. is required.";
        } else if (!/^\d{10}$/.test(student.mobileNo.trim())) {
          errors[`studentMobileNo_${idx}`] = "Mobile No. must be 10 digits.";
        }
      });
    }

    // Expenses validation (optional, but if filled, must have amount and category)
    formData.expenses.forEach((expense, idx) => {
      if (!expense.category.trim()) {
        errors[`expenseCategory_${idx}`] = "Category is required.";
      }
      if (!expense.amount.trim()) {
        errors[`expenseAmount_${idx}`] = "Amount is required.";
      } else if (isNaN(expense.amount) || Number(expense.amount) <= 0) {
        errors[`expenseAmount_${idx}`] = "Amount must be a positive number.";
      }
    });

    // Total budget must be positive number
    if (!formData.totalBudget.trim()) {
      errors.totalBudget = "Total budget is required.";
    } else if (isNaN(formData.totalBudget) || Number(formData.totalBudget) <= 0) {
      errors.totalBudget = "Total budget must be a positive number.";
    }

    // Signatures validation (required)
    if (!formData.groupLeaderSignature) {
      errors.groupLeaderSignature = "Group leader signature is required.";
    } else if (formData.groupLeaderSignature.type !== "image/jpeg") {
      errors.groupLeaderSignature = "Group leader signature must be a JPEG image.";
    }

    if (!formData.guideSignature) {
      errors.guideSignature = "Guide signature is required.";
    } else if (formData.guideSignature.type !== "image/jpeg") {
      errors.guideSignature = "Guide signature must be a JPEG image.";
    }

    // Uploaded document optional but if present, must be PDF and <= 5MB
    if (formData.uploadedFile) {
      if (formData.uploadedFile.type !== "application/pdf") {
        errors.uploadedFile = "Additional document must be a PDF.";
      }
      if (formData.uploadedFile.size > 5 * 1024 * 1024) {
        errors.uploadedFile = "Additional document must be under 5MB.";
      }
    }

    setFormData(prev => ({ ...prev, errors }));

    return Object.keys(errors).length === 0; // valid if no errors
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value, errors: { ...formData.errors, [name]: null } });
  };

  const updateStudentField = (e, index, field) => {
    const updatedStudents = [...formData.students];
    updatedStudents[index][field] = e.target.value;
    setFormData({ ...formData, students: updatedStudents });
  };

  const updateExpenseField = (e, index, field) => {
    const updatedExpenses = [...formData.expenses];
    updatedExpenses[index][field] = e.target.value;
    setFormData({ ...formData, expenses: updatedExpenses });
  };


  const handleFileUpload = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be under 5MB.");
        return;
      }
      setFormData({ ...formData, [name]: file, errors: { ...formData.errors, [name]: null } });
    }
  };

  const removeExpenseRow = (index) => {
    const updatedExpenses = [...formData.expenses];
    updatedExpenses.splice(index, 1);
    setFormData({ ...formData, expenses: updatedExpenses });
  };

  // Other handlers stay the same...

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the errors in the form.");
      return;
    }

    try {
      const formDataToSend = {
        projectTitle: formData.projectTitle,
        projectDescription: formData.projectDescription,
        projectUtility: formData.utility,
        finance: formData.financeDetails,
        employeeCode: formData.guideEmployeeCode,
        amountClaimed: formData.totalBudget,
        receivedFinance: formData.receivedFinance,
        guideName: formData.guideName,
        students: formData.students,
        expenses: formData.expenses,
      };

      const response = await fetch("http://localhost:5000/api/ug2form/saveFormData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Form submitted successfully!");
      } else {
        console.error("❌ Submission Failed:", data);
        alert("Error: " + (data.message || "Something went wrong"));
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      alert("Submission failed! Please try again.");
    }
  };

  const addStudentRow = () => {
    setFormData(prevData => ({
      ...prevData,
      students: [...prevData.students, { name: '', usn: '', email: '', department: '' }]
    }));
  };

  const addExpenseRow = () => {
    setFormData(prevData => ({
      ...prevData,
      expenses: [...prevData.expenses, { category: "", amount: "", details: "" }],
    }));
  };

  return (
    <div className="form-container">
      <h2>Under Graduate Form 2</h2>
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
              <th>Action</th>
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
                  {formData.errors[`studentName_${index}`] && (
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
                  {formData.errors[`studentYear_${index}`] && (
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
                  {formData.errors[`studentClass_${index}`] && (
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
                  {formData.errors[`studentDiv_${index}`] && (
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
                  {formData.errors[`studentBranch_${index}`] && (
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
                  {formData.errors[`studentRollNo_${index}`] && (
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
                  {formData.errors[`studentMobileNo_${index}`] && (
                    <p className="error-message">{formData.errors[`studentMobileNo_${index}`]}</p>
                  )}
                </td>
                <td>
                  {!viewOnly && (
                    <button type="button" className="remove-btn" onClick={() => removeStudentRow(index)}>
                      ❌
                    </button>
                  )}
                </td>
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
              <th>Action</th>
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
                  {formData.errors[`expenseCategory_${index}`] && (
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
                  {formData.errors[`expenseAmount_${index}`] && (
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
                <td>
                  {!viewOnly && (
                    <button type="button" className="remove-btn" onClick={() => removeExpenseRow(index)}>
                      ❌
                    </button>
                  )}
                </td>
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

        <div className="signatures">
          <div>
            <label>Signature of Group Leader (JPEG Only)</label>
            <input
              type="file"
              accept="image/jpeg"
              name="groupLeaderSignature"
              onChange={handleFileUpload}
              disabled={viewOnly}
            />
            {formData.groupLeaderSignature && <p className="file-name">{formData.groupLeaderSignature.name}</p>}
            {formData.errors.groupLeaderSignature && (
              <p className="error-message">{formData.errors.groupLeaderSignature}</p>
            )}
          </div>

          <div>
            <label>Signature of Guide (JPEG Only)</label>
            <input
              type="file"
              accept="image/jpeg"
              name="guideSignature"
              onChange={handleFileUpload}
              disabled={viewOnly}
            />
            {formData.guideSignature && <p className="file-name">{formData.guideSignature.name}</p>}
            {formData.errors.guideSignature && <p className="error-message">{formData.errors.guideSignature}</p>}
          </div>
        </div>

        <label>Upload Additional Document (PDF, max 5MB):</label>
        <input
          type="file"
          accept="application/pdf"
          name="uploadedFile"
          onChange={handleFileUpload}
          disabled={viewOnly}
        />
        {formData.uploadedFile && <p className="file-name">{formData.uploadedFile.name}</p>}
        {formData.errors.uploadedFile && <p className="error-message">{formData.errors.uploadedFile}</p>}

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
