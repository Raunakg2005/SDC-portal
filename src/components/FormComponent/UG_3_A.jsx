import React, { useState, useEffect } from "react";
import axios from "axios";

const UG3AForm = ({ initialData = null, readOnly = false }) => {
  const [formData, setFormData] = useState(
    initialData ?? {
      organizingInstitute: '',
      projectTitle: '',
      students: [
        { name: "", class: "", div: "", branch: "", rollNo: "", mobileNo: "" }
      ],
      expenses: [
        { srNo: "1", description: "", amount: "" }
      ],
      bankDetails: {
        beneficiary: "",
        bankName: "",
        branch: "",
        ifsc: "",
        accountNumber: ""
      }
    }
  );

  const [totalAmount, setTotalAmount] = useState(0);
  const [files, setFiles] = useState({
    image: null,
    document: null
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    let errors = {};

    if (!formData.organizingInstitute.trim()) {
      errors.organizingInstitute = "Organizing Institute is required.";
    }
    if (!formData.projectTitle.trim()) {
      errors.projectTitle = "Project Title is required.";
    }

    formData.students.forEach((student, i) => {
      if (!student.name.trim()) errors[`student_name_${i}`] = "Name is required";
      if (!student.class.trim()) errors[`student_class_${i}`] = "Class is required";
      if (!student.div.trim()) errors[`student_div_${i}`] = "Div is required";
      if (!student.branch.trim()) errors[`student_branch_${i}`] = "Branch is required";
      if (!student.rollNo.trim()) errors[`student_rollNo_${i}`] = "Roll No. is required";
      if (!student.mobileNo.trim()) errors[`student_mobileNo_${i}`] = "Mobile No. is required";
    });

    formData.expenses.forEach((expense, i) => {
      if (!expense.description.trim()) errors[`expense_description_${i}`] = "Description is required";
      if (expense.amount === "" || isNaN(expense.amount) || parseFloat(expense.amount) <= 0) {
        errors[`expense_amount_${i}`] = "Valid amount is required";
      }
    });

    const bd = formData.bankDetails;
    if (!bd.beneficiary.trim()) errors.beneficiary = "Beneficiary is required";
    if (!bd.bankName.trim()) errors.bankName = "Bank Name is required";
    if (!bd.branch.trim()) errors.branch = "Branch is required";
    if (!bd.ifsc.trim()) errors.ifsc = "IFSC Code is required";
    if (!bd.accountNumber.trim()) errors.accountNumber = "Account Number is required";

    // Optionally, validate files
    if (!files.image && !files.document) {
      errors.files = "At least one file upload is required.";
    }
    setValidationErrors(errors);
    // Return true if no errors
    return Object.keys(errors).length === 0;
  };
  const [errorMessage, setErrorMessage] = useState("");

  // Calculate total whenever expenses change
  useEffect(() => {
    const sum = formData.expenses.reduce((total, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return total + amount;
    }, 0);
    setTotalAmount(sum);
  }, [formData.expenses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (index, field, value) => {
    const newStudents = [...formData.students];
    newStudents[index][field] = value;
    setFormData(prev => ({ ...prev, students: newStudents }));
  };

  const handleExpenseChange = (index, field, value) => {
    const newExpenses = [...formData.expenses];
    newExpenses[index][field] = value;
    
    // Auto-increment serial numbers when adding new rows
    if (field === 'amount') {
      // Ensure amount is a valid number
      if (isNaN(value) || value === '') {
        newExpenses[index].amount = '';
      } else {
        newExpenses[index].amount = parseFloat(value) || 0;
      }
    }
    
    setFormData(prev => ({ ...prev, expenses: newExpenses }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    if (field === "image") {
      if (!file.type.startsWith("image/jpeg")) {
        setErrorMessage("Only JPEG format is allowed for images.");
        e.target.value = null;
        return;
      }
      setFiles(prev => ({ ...prev, image: file }));
    } else if (field === "document") {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size must be less than 5MB.");
        e.target.value = null;
        return;
      }
      setFiles(prev => ({ ...prev, document: file }));
    }
  
    setErrorMessage("");
  };

  const addStudent = () => {
    setFormData(prev => ({
      ...prev,
      students: [...prev.students, { name: "", class: "", div: "", branch: "", rollNo: "", mobileNo: "" }]
    }));
  };

  const removeStudent = (index) => {
    if (formData.students.length > 1) {
      const newStudents = formData.students.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, students: newStudents }));
    }
  };

  const addExpense = () => {
    const newSrNo = (formData.expenses.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { srNo: newSrNo, description: "", amount: "" }]
    }));
  };

  const removeExpense = (index) => {
    if (formData.expenses.length > 1) {
      const newExpenses = formData.expenses.filter((_, i) => i !== index)
        .map((expense, i) => ({ ...expense, srNo: (i + 1).toString() }));
      setFormData(prev => ({ ...prev, expenses: newExpenses }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setErrorMessage("Please fix the validation errors.");
      return;
    }
    setErrorMessage("");
    const form = new FormData();
    form.append("organizingInstitute", formData.organizingInstitute);
    form.append("projectTitle", formData.projectTitle);
    form.append("students", JSON.stringify(formData.students));
    form.append("expenses", JSON.stringify(formData.expenses));
    form.append("bankDetails", JSON.stringify(formData.bankDetails));
    
    if (files.image) form.append("image", files.image);
    if (files.document) form.append("document", files.document);
  
    try {
      await axios.post("http://localhost:5000/api/ug3aform/submit", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Form submitted successfully!");
    } catch (err) {
      console.error("Submit error:", err);
      alert("Form submission failed.");
    }
  };

  return (
    <div className="form-container max-w-4xl mx-auto p-5 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Under Graduate Form 3A - Project Competition</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Application Form</h2>
        
        {errorMessage && (
          <div className="bg-red-200 text-red-800 p-3 mb-4 rounded">{errorMessage}</div>
        )}

        {/* Organizing Institute */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Name and Address of Organizing Institute:</label>
          {readOnly ? (
            <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.organizingInstitute}</p>
          ) : (
            <>
              <input
                type="text"
                name="organizingInstitute"
                value={formData.organizingInstitute}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  validationErrors.organizingInstitute ? "border-red-500" : "border-gray-300"
                }`}
              />
              {validationErrors.organizingInstitute && <p className="text-red-500 text-sm mt-1">{validationErrors.organizingInstitute}</p>}
            </>
          )}
        </div>
        
        {/* Project Title */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Title of Project:</label>
          {readOnly ? (
            <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.projectTitle}</p>
          ):(
            <>
             <input
            type="text"
            name="projectTitle"
            value={formData.projectTitle}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {validationErrors.projectTitle && <p className="text-red-500 text-sm mt-1">{validationErrors.projectTitle}</p>}
          </>
          )}
        </div>

        {/* Student Details */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Student Details</h3>
          {readOnly ? (
            <div className="space-y-4">
              {formData.students.map((student, index) => (
                <div key={index} className="p-4 border border-gray-300 rounded bg-gray-50">
                  <h4 className="font-medium mb-2">Student {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">Name: </span>
                      <span>{student.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Class: </span>
                      <span>{student.class}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Div: </span>
                      <span>{student.div}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Branch: </span>
                      <span>{student.branch}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Roll No.: </span>
                      <span>{student.rollNo}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Mobile No.: </span>
                      <span>{student.mobileNo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <table className="w-full mb-4 border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-gray-300">Name of Student</th>
                    <th className="p-2 border border-gray-300">Class</th>
                    <th className="p-2 border border-gray-300">Div</th>
                    <th className="p-2 border border-gray-300">Branch</th>
                    <th className="p-2 border border-gray-300">Roll No.</th>
                    <th className="p-2 border border-gray-300">Mobile No.</th>
                    <th className="p-2 border border-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.students.map((student, index) => (
                    <tr key={index}>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                          className={`w-full p-2 border rounded ${
                            validationErrors[`student_name_${index}`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {validationErrors[`student_name_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`student_name_${index}`]}</p>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="text"
                          value={student.class}
                          onChange={(e) => handleStudentChange(index, 'class', e.target.value)}
                          className={`w-full p-2 border rounded ${
                            validationErrors[`student_class_${index}`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {validationErrors[`student_class_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`student_class_${index}`]}</p>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="text"
                          value={student.div}
                          onChange={(e) => handleStudentChange(index, 'div', e.target.value)}
                          className={`w-full p-2 border rounded ${
                            validationErrors[`student_div_${index}`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {validationErrors[`student_div_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`student_div_${index}`]}</p>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="text"
                          value={student.branch}
                          onChange={(e) => handleStudentChange(index, 'branch', e.target.value)}
                          className={`w-full p-2 border rounded ${
                            validationErrors[`student_branch_${index}`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {validationErrors[`student_branch_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`student_branch_${index}`]}</p>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="text"
                          value={student.rollNo}
                          onChange={(e) => handleStudentChange(index, 'rollNo', e.target.value)}
                          className={`w-full p-2 border rounded ${
                            validationErrors[`student_rollNo_${index}`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {validationErrors[`student_rollNo_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`student_rollNo_${index}`]}</p>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="text"
                          value={student.mobileNo}
                          onChange={(e) => handleStudentChange(index, 'mobileNo', e.target.value)}
                          className={`w-full p-2 border rounded ${
                            validationErrors[`student_mobileNo_${index}`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {validationErrors[`student_mobileNo_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`student_mobileNo_${index}`]}</p>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300 text-center">
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 text-lg"
                          onClick={() => removeStudent(index)}
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={addStudent}
              >
                ➕ Add More Student
              </button>
            </>
          )}
        </div>

        {/* Expenses */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Details of Expenses</h3>
          {readOnly ? (
            <div className="space-y-3">
              {formData.expenses.map((expense, index) => (
                <div key={index} className="p-3 border border-gray-300 rounded bg-gray-50 flex justify-between items-center">
                  <div className="flex-1">
                    <span className="font-semibold">Sr. No. {expense.srNo}: </span>
                    <span>{expense.description}</span>
                  </div>
                  <div className="font-semibold text-green-600">
                    ₹{expense.amount}
                  </div>
                </div>
              ))}
              <div className="p-3 border border-gray-300 rounded bg-gray-100 flex justify-between items-center font-bold text-lg">
                <span>Total Amount:</span>
                <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <>
              <table className="w-full mb-4 border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border border-gray-300">Sr. No.</th>
                    <th className="p-2 border border-gray-300">Description</th>
                    <th className="p-2 border border-gray-300">Amount (₹)</th>
                    <th className="p-2 border border-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.expenses.map((expense, index) => (
                    <tr key={index}>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="text"
                          value={expense.srNo}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                        />
                      </td>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="text"
                          value={expense.description}
                          onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                          className={`w-full p-2 border rounded ${
                            validationErrors[`expense_description_${index}`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {validationErrors[`expense_description_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`expense_description_${index}`]}</p>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300">
                        <input
                          type="number"
                          value={expense.amount}
                          onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                          className={`w-full p-2 border rounded ${
                            validationErrors[`expense_amount_${index}`] ? "border-red-500" : "border-gray-300"
                          }`}
                          min="0"
                          step="0.01"
                        />
                        {validationErrors[`expense_amount_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`expense_amount_${index}`]}</p>
                        )}
                      </td>
                      <td className="p-2 border border-gray-300 text-center">
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 text-lg"
                          onClick={() => removeExpense(index)}
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="p-2 border border-gray-300" colSpan="2">Total Amount</td>
                    <td className="p-2 border border-gray-300 text-green-600">
                      ₹{totalAmount.toFixed(2)}
                    </td>
                    <td className="p-2 border border-gray-300"></td>
                  </tr>
                </tbody>
              </table>
              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={addExpense}
              >
                ➕ Add More Expense
              </button>
            </>
          )}
        </div>

        {/* Bank Details */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Bank Details for RTGS/NEFT</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block font-semibold mb-1">Beneficiary name, brief address and mobile no.:</label>
              {readOnly ? (
                <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.beneficiary}</p>
              ) : (
                <input
                  type="text"
                  name="beneficiary"
                  value={formData.bankDetails.beneficiary}
                  onChange={handleBankChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Bank Name:</label>
                {readOnly ? (
                  <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.bankName}</p>
                ) : (
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleBankChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1">Branch:</label>
                {readOnly ? (
                  <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.branch}</p>
                ) : (
                  <input
                    type="text"
                    name="branch"
                    value={formData.bankDetails.branch}
                    onChange={handleBankChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">IFSC Code:</label>
                {readOnly ? (
                  <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.ifsc}</p>
                ) : (
                  <input
                    type="text"
                    name="ifsc"
                    value={formData.bankDetails.ifsc}
                    onChange={handleBankChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1">Account Number:</label>
                {readOnly ? (
                  <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.accountNumber}</p>
                ) : (
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleBankChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File Uploads */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block font-semibold mb-2">Upload Image (JPEG Only):</label>
            {readOnly ? (
              <div className="p-2 border border-gray-300 rounded bg-gray-100">
                {files.image ? files.image.name : "No file uploaded"}
              </div>
            ) : (
              <div className="flex items-center">
                <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg"
                    onChange={(e) => handleFileChange("image", e)}
                  />
                </label>
                {files.image && (
                  <span className="ml-2 text-sm">{files.image.name}</span>
                )}
              </div>
            )}
          </div>
          
          <div>
            <label className="block font-semibold mb-2">Upload Additional Documents (Max 5MB):</label>
            {readOnly ? (
              <div className="p-2 border border-gray-300 rounded bg-gray-100">
                {files.document ? files.document.name : "No file uploaded"}
              </div>
            ) : (
              <div className="flex items-center">
                <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange("document", e)}
                  />
                </label>
                {files.document && (
                  <span className="ml-2 text-sm">{files.document.name}</span>
                )}
              </div>
            )}
          </div>
          
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
        </div>

        {/* Form Actions */}
        {!readOnly && (
          <div className="flex justify-between">
            <button onClick={() => window.history.back()} className="back-btn bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600">
              Back
            </button>
            <button  onClick={handleSubmit} className="submit-btn bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UG3AForm;