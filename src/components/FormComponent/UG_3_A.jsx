import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    image: null,     // For the existing image upload (e.g., student group photo or leader's photo)
    pdfs: [],        // Array to store up to 5 PDF files
    zipFile: null    // To store the single ZIP file
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // Refs for file inputs to clear their values
  // These need to be attached to your actual file input JSX elements
  const imageInputRef = useRef(null); // Ref for the 'image' input
  const pdfsInputRef = useRef(null);  // Ref for the 'pdfs' input
  const zipFileInputRef = useRef(null); // Ref for the 'zipFile' input

  // Effect to populate form data and files when initialData changes or readOnly mode changes
  useEffect(() => {
    if (initialData) {
      // Use initialData values, providing fallbacks for missing fields
      setFormData({
        organizingInstitute: initialData.organizingInstitute || '',
        projectTitle: initialData.projectTitle || '',
        students: initialData.students || [{ name: "", class: "", div: "", branch: "", rollNo: "", mobileNo: "" }],
        expenses: initialData.expenses || [{ srNo: "1", description: "", amount: "" }],
        bankDetails: initialData.bankDetails || {
          beneficiary: "",
          bankName: "",
          branch: "",
          ifsc: "",
          accountNumber: ""
        },
        // If other fields exist in initialData but not in default state, they won't be set here
        // e.g., projectDescription, utility, receivedFinance etc.
      });

      // Set file states from initialData if available
      setFiles({
        image: initialData.image || null,
        pdfs: initialData.pdfs || [],
        zipFile: initialData.zipFile || null
      });

      setErrorMessage(''); // Clear any previous errors
      setValidationErrors({}); // Clear validation errors on new data load
    } else if (!readOnly) {
      // If no initialData is provided and we are not in readOnly mode, reset to a fresh form state
      setFormData({
        organizingInstitute: '',
        projectTitle: '',
        students: [{ name: "", class: "", div: "", branch: "", rollNo: "", mobileNo: "" }],
        expenses: [{ srNo: "1", description: "", amount: "" }],
        bankDetails: {
          beneficiary: "",
          bankName: "",
          branch: "",
          ifsc: "",
          accountNumber: ""
        },
      });
      setFiles({
        image: null,
        pdfs: [],
        zipFile: null
      });
      setErrorMessage('');
      setValidationErrors({});
    }
  }, [initialData, readOnly]); // Dependencies: re-run when initialData or readOnly prop changes

  // Effect to calculate totalAmount whenever expenses change
  useEffect(() => {
    const sum = formData.expenses.reduce((total, expense) => {
      const amount = parseFloat(expense.amount) || 0; // Ensure amount is treated as a number
      return total + amount;
    }, 0);
    setTotalAmount(sum);
  }, [formData.expenses]); // Dependency: recalculate when formData.expenses changes

  // Generic change handler for top-level form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Note: If you add checkboxes, you'll need `type, checked` as before:
    // const { name, value, type, checked } = e.target;
    // [name]: type === "checkbox" ? checked : value,
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Change handler for student array fields (maintaining immutability)
  const handleStudentChange = (index, field, value) => {
    setFormData(prevData => {
      const newStudents = [...prevData.students];
      newStudents[index] = {
        ...newStudents[index], // Spread existing student data
        [field]: value,         // Update specific field
      };
      return { ...prevData, students: newStudents };
    });
  };

  // Add new student row
  const addStudent = () => {
    setFormData(prev => ({
      ...prev,
      students: [...prev.students, { name: "", class: "", div: "", branch: "", rollNo: "", mobileNo: "" }]
    }));
  };

  // Remove student row
  const removeStudent = (index) => {
    if (formData.students.length > 1) { // Ensure at least one student remains
      const newStudents = formData.students.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, students: newStudents }));
    }
  };

  // Change handler for expense array fields (maintaining immutability and parsing amount)
  const handleExpenseChange = (index, field, value) => {
    setFormData(prevData => {
      const newExpenses = [...prevData.expenses];
      newExpenses[index] = {
        ...newExpenses[index], // Spread existing expense data
        [field]: value,         // Update specific field
      };

      // Ensure amount is handled as a number
      if (field === 'amount') {
          newExpenses[index].amount = value === '' ? '' : parseFloat(value) || 0;
      }

      return { ...prevData, expenses: newExpenses };
    });
  };

  // Add new expense row
  const addExpense = () => {
    const newSrNo = (formData.expenses.length + 1).toString(); // Auto-increment Sr. No.
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { srNo: newSrNo, description: "", amount: "" }]
    }));
  };

  // Remove expense row
  const removeExpense = (index) => {
    if (formData.expenses.length > 1) { // Ensure at least one expense remains
      const newExpenses = formData.expenses.filter((_, i) => i !== index)
        .map((expense, i) => ({ ...expense, srNo: (i + 1).toString() })); // Re-index Sr. No. after removal
      setFormData(prev => ({ ...prev, expenses: newExpenses }));
    }
  };

  // Change handler for bank details fields
  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  // Handle file input changes with validation
  const handleFileChange = (field, e) => {
    const selectedFiles = e.target.files;
    setErrorMessage(""); // Clear previous general error

    if (!selectedFiles || selectedFiles.length === 0) {
      // Clear the specific file state if no file is chosen (e.g., user cancels dialog)
      setFiles(prev => ({ ...prev, [field]: (field === 'pdfs' ? [] : null) }));
      return;
    }

    if (field === "image") {
      const file = selectedFiles[0];
      if (!file.type.startsWith("image/jpeg")) {
        setErrorMessage("Only JPEG format is allowed for images.");
        setFiles(prev => ({ ...prev, image: null }));
        e.target.value = null; // Reset file input
        return;
      }
      // Optional: Add size validation for image
      // if (file.size > 2 * 1024 * 1024) { // Example: 2MB limit
      //   setErrorMessage("Image size must be less than 2MB.");
      //   setFiles(prev => ({ ...prev, image: null }));
      //   e.target.value = null;
      //   return;
      // }
      setFiles(prev => ({ ...prev, image: file }));
    } else if (field === "pdfs") {
      const newPdfFiles = Array.from(selectedFiles);

      if (newPdfFiles.length > 5) {
        setErrorMessage("You can select a maximum of 5 PDF files.");
        setFiles(prev => ({ ...prev, pdfs: [] })); // Clear all selected PDFs if count is too high
        e.target.value = null;
        return;
      }

      for (const file of newPdfFiles) {
        if (file.type !== "application/pdf") {
          setErrorMessage(`File "${file.name}" is not a PDF. Please select only PDF files.`);
          setFiles(prev => ({ ...prev, pdfs: [] }));
          e.target.value = null;
          return;
        }
        // Optional: Add size validation for each PDF
        if (file.size > 5 * 1024 * 1024) { // Example: 5MB limit per PDF
          setErrorMessage(`PDF file "${file.name}" exceeds the 5MB size limit.`);
          setFiles(prev => ({ ...prev, pdfs: [] }));
          e.target.value = null;
          return;
        }
      }
      setFiles(prev => ({ ...prev, pdfs: newPdfFiles }));
    } else if (field === "zipFile") {
      const file = selectedFiles[0];
      // Basic ZIP type check (can be expanded for more MIME types if needed)
      if (!file.name.toLowerCase().endsWith('.zip') && !["application/zip", "application/x-zip-compressed", "application/octet-stream"].includes(file.type)) {
        setErrorMessage("Only ZIP files are allowed. Please select a .zip file.");
        setFiles(prev => ({ ...prev, zipFile: null }));
        e.target.value = null;
        return;
      }
      // Optional: Add size validation for ZIP file
      if (file.size > 20 * 1024 * 1024) { // Example: 20MB limit for ZIP
        setErrorMessage("ZIP file size must be less than 20MB.");
        setFiles(prev => ({ ...prev, zipFile: null }));
        e.target.value = null;
        return;
      }
      setFiles(prev => ({ ...prev, zipFile: file }));
    }

    // This line is often helpful for single file inputs to allow re-selecting the same file
    // after it has been cleared or an error occurred. For multiple files, it clears all.
    // e.target.value = null; // This will visually clear the input, but the state will hold the file(s)
  };

  // Callback to remove specific files (useful for displaying selected files with remove buttons)
  const handleRemoveFile = useCallback((fileType, index = null) => {
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      if (fileType === 'pdfs') {
        if (index !== null) { // Remove specific PDF by index
          newFiles[fileType] = prevFiles.pdfs.filter((_, i) => i !== index);
        } else { // Clear all PDFs (this case might be less common with individual remove buttons)
          newFiles[fileType] = [];
        }
      } else { // Clear single file (image, zipFile)
        newFiles[fileType] = null;
      }
      return newFiles;
    });

    // Clear corresponding input ref value to allow re-selection
    // Make sure these refs are correctly attached to your JSX inputs!
    if (fileType === 'image' && imageInputRef.current) {
        imageInputRef.current.value = '';
    } else if (fileType === 'pdfs' && pdfsInputRef.current) {
        pdfsInputRef.current.value = '';
    } else if (fileType === 'zipFile' && zipFileInputRef.current) {
        zipFileInputRef.current.value = '';
    }

    // Clear any validation errors related to this file type
    setValidationErrors(prev => ({ ...prev, [fileType]: undefined }));
    setErrorMessage('');
  }, []); // Dependencies for useCallback. None needed if refs are stable.

  // Validation logic for the entire form
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
      // Validate amount specifically for expenses
      if (expense.amount === "" || isNaN(parseFloat(expense.amount)) || parseFloat(expense.amount) <= 0) {
        errors[`expense_amount_${i}`] = "Valid amount is required";
      }
    });

    const bd = formData.bankDetails;
    if (!bd.beneficiary.trim()) errors.beneficiary = "Beneficiary is required";
    if (!bd.bankName.trim()) errors.bankName = "Bank Name is required";
    if (!bd.branch.trim()) errors.branch = "Branch is required";
    if (!bd.ifsc.trim()) errors.ifsc = "IFSC Code is required";
    if (!bd.accountNumber.trim()) errors.accountNumber = "Account Number is required";

    // File validations (adapted to your current `files` state and `initialData` existence)
    // If you always require an image, regardless of initialData:
    if (!files.image && !initialData?.image) { // If no new file selected and no existing image URL
        errors.image = "A project image is required.";
    }

    // If PDFs are mandatory and none are uploaded (or no existing ones in initialData):
    if (files.pdfs.length === 0 && (!initialData?.pdfs || initialData.pdfs.length === 0)) {
        errors.pdfs = "At least one PDF file is required.";
    }

    // If ZIP file is mandatory:
    if (!files.zipFile && !initialData?.zipFile) {
        errors.zipFile = "A ZIP file is required.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
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
  
    if (files.image) {
      // Change 'image' to 'uploadedImage' to match backend Multer
      form.append("uploadedImage", files.image);
    }

    // Append PDF files
    files.pdfs.forEach((pdfFile) => {
      // Change 'pdfFiles' to 'uploadedPdfs' to match backend Multer
      form.append("uploadedPdfs", pdfFile);
    });

    if (files.zipFile) {
      // Change 'zipFile' to 'uploadedZipFile' to match backend Multer
      form.append("uploadedZipFile", files.zipFile);
    }
  
    // The existing "document" field is removed as per new requirements
    // if (files.document) form.append("document", files.document);
  
    try {
      await axios.post("http://localhost:5000/api/ug3aform/submit", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Form submitted successfully!");
      // Optionally reset form state here
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
        <label htmlFor="organizingInstitute" className="block font-semibold mb-2">Name and Address of Organizing Institute:</label>
        {readOnly ? (
          <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.organizingInstitute}</p>
        ) : (
          <>
            <input
              type="text"
              id="organizingInstitute"
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
        <label htmlFor="projectTitle" className="block font-semibold mb-2">Title of Project:</label>
        {readOnly ? (
          <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.projectTitle}</p>
        ) : (
          <>
            <input
              type="text"
              id="projectTitle"
              name="projectTitle"
              value={formData.projectTitle}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                validationErrors.projectTitle ? "border-red-500" : "border-gray-300"
              }`}
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
                        disabled={readOnly || formData.students.length <= 1} // Disable if readOnly or only one student
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
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={addStudent}
              disabled={readOnly} // Disable in readOnly mode
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
                  ₹{parseFloat(expense.amount || 0).toFixed(2)}
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
                        disabled={readOnly || formData.expenses.length <= 1} // Disable if readOnly or only one expense
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
                  <td className="p-2 border border-gray-300"></td> {/* Empty cell for action column */}
                </tr>
              </tbody>
            </table>
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={addExpense}
              disabled={readOnly} // Disable in readOnly mode
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
            <label htmlFor="beneficiary" className="block font-semibold mb-1">Beneficiary name, brief address and mobile no.:</label>
            {readOnly ? (
              <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.beneficiary}</p>
            ) : (
              <>
                <input
                  type="text"
                  id="beneficiary"
                  name="beneficiary"
                  value={formData.bankDetails.beneficiary}
                  onChange={handleBankChange}
                  className={`w-full p-2 border rounded ${
                    validationErrors.beneficiary ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {validationErrors.beneficiary && <p className="text-red-500 text-sm mt-1">{validationErrors.beneficiary}</p>}
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bankName" className="block font-semibold mb-1">Bank Name:</label>
              {readOnly ? (
                <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.bankName}</p>
              ) : (
                <>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleBankChange}
                    className={`w-full p-2 border rounded ${
                      validationErrors.bankName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors.bankName && <p className="text-red-500 text-sm mt-1">{validationErrors.bankName}</p>}
                </>
              )}
            </div>
            <div>
              <label htmlFor="branch" className="block font-semibold mb-1">Branch:</label>
              {readOnly ? (
                <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.branch}</p>
              ) : (
                <>
                  <input
                    type="text"
                    id="branch"
                    name="branch"
                    value={formData.bankDetails.branch}
                    onChange={handleBankChange}
                    className={`w-full p-2 border rounded ${
                      validationErrors.branch ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors.branch && <p className="text-red-500 text-sm mt-1">{validationErrors.branch}</p>}
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ifsc" className="block font-semibold mb-1">IFSC Code:</label>
              {readOnly ? (
                <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.ifsc}</p>
              ) : (
                <>
                  <input
                    type="text"
                    id="ifsc"
                    name="ifsc"
                    value={formData.bankDetails.ifsc}
                    onChange={handleBankChange}
                    className={`w-full p-2 border rounded ${
                      validationErrors.ifsc ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors.ifsc && <p className="text-red-500 text-sm mt-1">{validationErrors.ifsc}</p>}
                </>
              )}
            </div>
            <div>
              <label htmlFor="accountNumber" className="block font-semibold mb-1">Account Number:</label>
              {readOnly ? (
                <p className="p-2 border border-gray-300 rounded bg-gray-100">{formData.bankDetails.accountNumber}</p>
              ) : (
                <>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleBankChange}
                    className={`w-full p-2 border rounded ${
                      validationErrors.accountNumber ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {validationErrors.accountNumber && <p className="text-red-500 text-sm mt-1">{validationErrors.accountNumber}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Uploads Section */}
      <div className="mb-6 border p-4 rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-2">File Uploads</h3>

        {/* Image Upload */}
        <div className="mb-4">
          <label htmlFor="image" className="block font-semibold mb-2">Upload Project Image (JPEG):</label>
          {readOnly ? (
            files.image ? (
                <p className="p-2 border border-gray-300 rounded bg-gray-100">
                    <a href={typeof files.image === 'string' ? files.image : URL.createObjectURL(files.image)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Image
                    </a>
                </p>
            ) : <p className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-500">No project image uploaded.</p>
          ) : (
            <>
              <input
                type="file"
                id="image"
                accept="image/jpeg"
                onChange={(e) => handleFileChange("image", e)}
                ref={imageInputRef}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {files.image && (
                <div className="mt-2 flex items-center justify-between p-2 border rounded bg-blue-50">
                  <span>{files.image.name || 'Project Image'}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('image')}
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
              {validationErrors.image && <p className="text-red-500 text-sm mt-1">{validationErrors.image}</p>}
            </>
          )}
        </div>

        {/* PDF Files Upload (up to 5) */}
        <div className="mb-4">
          <label htmlFor="pdfs" className="block font-semibold mb-2">Upload Supporting PDFs (max 5 files):</label>
          {readOnly ? (
            files.pdfs && files.pdfs.length > 0 ? (
                <div className="space-y-2 p-2 border border-gray-300 rounded bg-gray-100">
                    {files.pdfs.map((pdf, index) => (
                        <p key={index}>
                            <a href={typeof pdf === 'string' ? pdf : URL.createObjectURL(pdf)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {typeof pdf === 'string' ? `PDF ${index + 1}` : pdf.name}
                            </a>
                        </p>
                    ))}
                </div>
            ) : <p className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-500">No PDF files uploaded.</p>
          ) : (
            <>
              <input
                type="file"
                id="pdfs"
                multiple
                accept="application/pdf"
                onChange={(e) => handleFileChange("pdfs", e)}
                ref={pdfsInputRef}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {files.pdfs.length > 0 && (
                <div className="mt-2 space-y-2">
                  {files.pdfs.map((pdf, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded bg-blue-50">
                      <span>{pdf.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile('pdfs', index)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {validationErrors.pdfs && <p className="text-red-500 text-sm mt-1">{validationErrors.pdfs}</p>}
            </>
          )}
        </div>

        {/* ZIP File Upload */}
        <div className="mb-4">
          <label htmlFor="zipFile" className="block font-semibold mb-2">Upload Project Source Code (ZIP):</label>
          {readOnly ? (
            files.zipFile ? (
                <p className="p-2 border border-gray-300 rounded bg-gray-100">
                    <a href={typeof files.zipFile === 'string' ? files.zipFile : URL.createObjectURL(files.zipFile)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View ZIP File
                    </a>
                </p>
            ) : <p className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-500">No ZIP file uploaded.</p>
          ) : (
            <>
              <input
                type="file"
                id="zipFile"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) => handleFileChange("zipFile", e)}
                ref={zipFileInputRef}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {files.zipFile && (
                <div className="mt-2 flex items-center justify-between p-2 border rounded bg-blue-50">
                  <span>{files.zipFile.name || 'ZIP File'}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('zipFile')}
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
              {validationErrors.zipFile && <p className="text-red-500 text-sm mt-1">{validationErrors.zipFile}</p>}
            </>
          )}
        </div>
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