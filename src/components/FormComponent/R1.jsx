import React, { useState, useEffect } from 'react';
import axios from 'axios';

const R1 = ({ data = null, viewOnly = false }) => {
  const [formData, setFormData] = useState({
    guideName: data?.guideName || '',
    coGuideName: data?.coGuideName || '',
    employeeCodes: data?.employeeCodes || '',
    studentName: data?.studentName || '',
    yearOfAdmission: data?.yearOfAdmission || '',
    branch: data?.branch || '',
    rollNo: data?.rollNo || '',
    mobileNo: data?.mobileNo || '',
    feesPaid: data?.feesPaid || 'No',
    receivedFinance: data?.receivedFinance || 'No',
    financeDetails: data?.financeDetails || '',
    paperTitle: data?.paperTitle || '',
    paperLink: data?.paperLink || '',
    authors: data?.authors || ['', '', '', ''],
    sttpTitle: data?.sttpTitle || '',
    organizers: data?.organizers || '',
    reasonForAttending: data?.reasonForAttending || '',
    numberOfDays: data?.numberOfDays || '',
    dateFrom: data?.dateFrom || '',
    dateTo: data?.dateTo || '',
    registrationFee: data?.registrationFee || '',
    dateOfSubmission: data?.dateOfSubmission || '',
    remarksByHod: data?.remarksByHod || '',
    bankDetails: data?.bankDetails || {
      beneficiary: '',
      ifsc: '',
      bankName: '',
      branch: '',
      accountType: '',
      accountNumber: ''
    },
    amountClaimed: data?.amountClaimed || '',
    finalAmountSanctioned: data?.finalAmountSanctioned || '',
    status: data?.status || 'pending'
  });

  const [files, setFiles] = useState({
    proofDocument: data?.proofDocumentUrl ? { name: 'Proof Document', url: data.proofDocumentUrl } : null,
    receiptCopy: data?.receiptCopyUrl ? { name: 'Receipt Copy', url: data.receiptCopyUrl } : null,
    studentSignature: data?.studentSignatureUrl ? { name: 'Student Signature', url: data.studentSignatureUrl } : null,
    guideSignature: data?.guideSignatureUrl ? { name: 'Guide Signature', url: data.guideSignatureUrl } : null,
    hodSignature: data?.hodSignatureUrl ? { name: 'HOD Signature', url: data.hodSignatureUrl } : null,
    sdcChairpersonSignature: data?.sdcChairpersonSignatureUrl ? { name: 'SDC Chairperson Signature', url: data.sdcChairpersonSignatureUrl } : null, // Added for SDC Chairperson
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update form when data prop changes
  useEffect(() => {
    if (data) {
      setFormData({
        guideName: data.guideName || '',
        coGuideName: data.coGuideName || '',
        employeeCodes: data.employeeCodes || '',
        studentName: data.studentName || '',
        yearOfAdmission: data.yearOfAdmission || '',
        branch: data.branch || '',
        rollNo: data.rollNo || '',
        mobileNo: data.mobileNo || '',
        feesPaid: data.feesPaid || 'No',
        receivedFinance: data.receivedFinance || 'No',
        financeDetails: data.financeDetails || '',
        paperTitle: data.paperTitle || '',
        paperLink: data.paperLink || '',
        authors: data.authors || ['', '', '', ''],
        sttpTitle: data.sttpTitle || '',
        organizers: data.organizers || '',
        reasonForAttending: data.reasonForAttending || '',
        numberOfDays: data.numberOfDays || '',
        dateFrom: data.dateFrom || '',
        dateTo: data.dateTo || '',
        registrationFee: data.registrationFee || '',
        dateOfSubmission: data.dateOfSubmission || '',
        remarksByHod: data.remarksByHod || '',
        bankDetails: data.bankDetails || {
          beneficiary: '',
          ifsc: '',
          bankName: '',
          branch: '',
          accountType: '',
          accountNumber: ''
        },
        amountClaimed: data.amountClaimed || '',
        finalAmountSanctioned: data.finalAmountSanctioned || '',
        status: data.status || 'pending'
      });

      setFiles({
        proofDocument: data.proofDocumentUrl ? { name: 'Proof Document', url: data.proofDocumentUrl } : null,
        receiptCopy: data.receiptCopyUrl ? { name: 'Receipt Copy', url: data.receiptCopyUrl } : null,
        studentSignature: data.studentSignatureUrl ? { name: 'Student Signature', url: data.studentSignatureUrl } : null,
        guideSignature: data.guideSignatureUrl ? { name: 'Guide Signature', url: data.guideSignatureUrl } : null,
        hodSignature: data.hodSignatureUrl ? { name: 'HOD Signature', url: data.hodSignatureUrl } : null,
        sdcChairpersonSignature: data.sdcChairpersonSignatureUrl ? { name: 'SDC Chairperson Signature', url: data.sdcChairpersonSignatureUrl } : null, // Added for SDC Chairperson
      });
    }
  }, [data]);

  const handleChange = (e) => {
    if (viewOnly) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    if (viewOnly) return;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  const handleAuthorChange = (index, value) => {
    if (viewOnly) return;
    const newAuthors = [...formData.authors];
    newAuthors[index] = value;
    setFormData(prev => ({ ...prev, authors: newAuthors }));
  };

  const handleFileChange = (field, e) => {
    if (viewOnly) return;
    const file = e.target.files[0];
    if (!file) return;

    // File validation
    if (field.includes('Signature') && !file.type.startsWith('image/')) {
      alert('❌ Only image files are allowed for signatures.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ File must be less than 5MB.');
      return;
    }

    setFiles(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.guideName.trim() || !formData.studentName.trim() || !formData.rollNo.trim()) {
      setErrorMessage('Please fill all required fields (Guide Name, Student Name, Roll No).');
      return false;
    }

    // Validate roll number format (assuming 11 digits like UG1)
    if (!/^\d{11}$/.test(formData.rollNo)) {
      setErrorMessage('Roll Number must be exactly 11 digits.');
      return false;
    }

    // Validate mobile number
    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      setErrorMessage('Mobile Number must be exactly 10 digits.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly || isSubmitting) return;

    setErrorMessage('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const submissionData = new FormData();

    // Append primitive fields
    for (const [key, value] of Object.entries(formData)) {
      if (Array.isArray(value)) {
        submissionData.append(key, JSON.stringify(value));
      } else if (typeof value === 'object' && value !== null) {
        submissionData.append(key, JSON.stringify(value));
      } else {
        submissionData.append(key, value);
      }
    }

    // Append files individually (only if they're actual files, not URLs)
    Object.entries(files).forEach(([key, file]) => {
      if (file && file instanceof File) {
        submissionData.append(key, file);
      }
    });

    try {
      const response = await axios.post("http://localhost:5000/api/r1form/submit", submissionData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("✅ Form submitted successfully!");
      // Optionally redirect or clear form
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      setErrorMessage("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  // Helper function to render file display
  const renderFileDisplay = (fileKey, label) => {
    const file = files[fileKey];
    
    if (viewOnly && file && file.url) {
      return (
        <div className="flex items-center">
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View {label}
          </a>
        </div>
      );
    } else if (!viewOnly) {
      return (
        <div className="flex items-center">
          <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
            Choose File
            <input
              type="file"
              className="hidden"
              accept={fileKey.includes('Signature') ? 'image/*' : '*'}
              onChange={(e) => handleFileChange(fileKey, e)}
            />
          </label>
          <span className="ml-2 text-sm">
            {file ? (file.name || 'File selected') : "No file chosen"}
          </span>
        </div>
      );
    } else if (file) { // For viewOnly when a file object (not a URL) is present, perhaps from initial data
      return <span className="text-sm text-gray-600">{file.name}</span>;
    }
    
    return <span className="text-sm text-gray-400">No file uploaded</span>;
  };

  return (
    <div className="form-container max-w-4xl mx-auto p-5 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Research Form R1 {viewOnly && <span className="text-blue-600">(View Only)</span>}
      </h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Application Form</h2>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        
        {/* Guide and Student Information */}
        <table className="w-full mb-6 border border-gray-300">
          <tbody>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Name/s of the guide / co-guide (wherever applicable)</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="guideName"
                  value={formData.guideName}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                  placeholder="Guide Name"
                  required
                />
                <input
                  type="text"
                  name="coGuideName"
                  value={formData.coGuideName}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded mt-2 disabled:bg-gray-100"
                  placeholder="Co-guide Name"
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Employee Codes</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="employeeCodes"
                  value={formData.employeeCodes}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Name of the student</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                  placeholder="Student Name"
                  required
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Year of Admission</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="yearOfAdmission"
                  value={formData.yearOfAdmission}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Branch</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Roll No.</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                  required
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Mobile No.</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Whether Paid fees for Current Academic Year</th>
              <td className="p-2 border border-gray-300">
                <select
                  name="feesPaid"
                  value={formData.feesPaid}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Whether received finance from any other agency</th>
              <td className="p-2 border border-gray-300">
                <select
                  name="receivedFinance"
                  value={formData.receivedFinance}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td colSpan="2" className="p-2 border border-gray-300">
                {formData.receivedFinance === 'Yes' && (
                  <input
                    type="text"
                    name="financeDetails"
                    value={formData.financeDetails}
                    onChange={handleChange}
                    disabled={viewOnly}
                    className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                    placeholder="Provide details"
                  />
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Journal/Paper/Poster Section */}
        <div className="mb-6 p-4 border border-gray-300 rounded">
          <h3 className="font-semibold mb-4 text-lg">For Journal/Paper/Poster Presentation</h3>
          
          <div className="mb-4">
            <label className="block font-semibold mb-1">Title of Paper</label>
            <input
              type="text"
              name="paperTitle"
              value={formData.paperTitle}
              onChange={handleChange}
              disabled={viewOnly}
              className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
            />
          </div>
          
          <div className="mb-4">
            <label className="block font-semibold mb-1">If paper is available online, then state link</label>
            <input
              type="url"
              name="paperLink"
              value={formData.paperLink}
              onChange={handleChange}
              disabled={viewOnly}
              className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
            />
          </div>
          
          <div className="mb-4">
            <label className="block font-semibold mb-1">Names of Authors</label>
            <div className="grid grid-cols-2 gap-4">
              {formData.authors.map((author, index) => (
                <div key={index}>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => handleAuthorChange(index, e.target.value)}
                    disabled={viewOnly}
                    className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                    placeholder={`Author ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STTP/Workshop Section */}
        <div className="mb-6 p-4 border border-gray-300 rounded">
          <h3 className="font-semibold mb-4 text-lg">For attending STTP/Workshops</h3>
          
          <div className="mb-4">
            <label className="block font-semibold mb-1">Title of the STTP/Workshop</label>
            <input
              type="text"
              name="sttpTitle"
              value={formData.sttpTitle}
              onChange={handleChange}
              disabled={viewOnly}
              className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
            />
          </div>
          
          <div className="mb-4">
            <label className="block font-semibold mb-1">Name and address of organizers (give website also)</label>
            <input
              type="text"
              name="organizers"
              value={formData.organizers}
              onChange={handleChange}
              disabled={viewOnly}
              className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
            />
          </div>
          
          <div className="mb-4">
            <label className="block font-semibold mb-1">Brief reason for attending the Workshop/STTP</label>
            <textarea
              name="reasonForAttending"
              value={formData.reasonForAttending}
              onChange={handleChange}
              disabled={viewOnly}
              className="w-full p-1 border border-gray-300 rounded h-20 disabled:bg-gray-100"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Number of days of Workshop/STTP</label>
              <input
                type="number"
                name="numberOfDays"
                value={formData.numberOfDays}
                onChange={handleChange}
                disabled={viewOnly}
                className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">From Date</label>
              <input
                type="date"
                name="dateFrom"
                value={formData.dateFrom}
                onChange={handleChange}
                disabled={viewOnly}
                className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">To Date</label>
              <input
                type="date"
                name="dateTo"
                value={formData.dateTo}
                onChange={handleChange}
                disabled={viewOnly}
                className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        <p className="text-sm italic mb-6 text-gray-600">*Attach a copy of paper published / presented / proof of participation/registration fee receipt</p>

        {/* Bank Details */}
        <table className="w-full mb-6 border border-gray-300">
          <tbody>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100" colSpan="2">Bank details for RTGS/NEFT</th>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Registration fee paid: Rs.</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                  placeholder="Rs.___________"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Beneficiary name, brief address and mobile no.</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="beneficiary"
                  value={formData.bankDetails.beneficiary}
                  onChange={handleBankChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">IFSC Code</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="ifsc"
                  value={formData.bankDetails.ifsc}
                  onChange={handleBankChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Name of the bank</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankDetails.bankName}
                  onChange={handleBankChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Branch</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="branch"
                  value={formData.bankDetails.branch}
                  onChange={handleBankChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Account type</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="accountType"
                  value={formData.bankDetails.accountType}
                  onChange={handleBankChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Account number</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleBankChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* File Uploads */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block font-semibold mb-2">Attach proof documents:</label>
            {renderFileDisplay('proofDocument', 'Proof Document')}
          </div>

          <div>
            <label className="block font-semibold mb-2">Attach registration fee receipt:</label>
            {renderFileDisplay('receiptCopy', 'Receipt Copy')}
          </div>
        </div>

        {/* Signatures */}
        <div className="mb-6">
          <div className="mb-4">
            <label className="block font-semibold mb-2">Date of Submission:</label>
            <input
              type="date"
              name="dateOfSubmission"
              value={formData.dateOfSubmission}
              onChange={handleChange}
              disabled={viewOnly}
              className="w-full p-1 border border-gray-300 rounded max-w-xs disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold mb-2">Signature of the student</label>
              {renderFileDisplay('studentSignature', 'Student Signature')}
            </div>

            <div>
              <label className="block font-semibold mb-2">Signature of Guide / Co-guide</label>
              {renderFileDisplay('guideSignature', 'Guide Signature')}
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Remarks by HOD:</label>
            <textarea
              name='remarksByHod'
              value={formData.remarksByHod}
              onChange={handleChange}
              disabled={viewOnly}
              className="w-full p-2 border border-gray-300 rounded h-20 disabled:bg-gray-100"
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Signature of HOD</label>
            {renderFileDisplay('hodSignature', 'HOD Signature')}
          </div>
        </div>

        {/* Approval Section */}
        <table className="w-full mb-6 border border-gray-300">
          <tbody>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Amount claimed</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="amountClaimed"
                  value={formData.amountClaimed}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                  placeholder="Rs.___________"
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Final Amount sanctioned</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="finalAmountSanctioned"
                  value={formData.finalAmountSanctioned}
                  onChange={handleChange}
                  disabled={viewOnly}
                  className="w-full p-1 border border-gray-300 rounded disabled:bg-gray-100"
                  placeholder="Rs.___________"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Signature of chairperson of SDC with date:</th>
              <td colSpan="3" className="p-2 border border-gray-300">
                <div className="flex items-center">
                  {!viewOnly ? (
                    <>
                      <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                        Upload Signature
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange('sdcChairpersonSignature', e)}
                        />
                      </label>
                      <span className="ml-2 text-sm">
                        {files.sdcChairpersonSignature ? (files.sdcChairpersonSignature.name || 'File selected') : "No file chosen"}
                      </span>
                      {/* You might want a separate state for this date if it's not part of formData */}
                      <input
                        type="date"
                        className="ml-2 p-1 border border-gray-300 rounded"
                        disabled={viewOnly}
                        // This date should ideally be managed in formData or a separate state
                        // Example: value={formData.sdcChairpersonDate} onChange={handleChange}
                      />
                    </>
                  ) : (
                    <>
                      {renderFileDisplay('sdcChairpersonSignature', 'SDC Chairperson Signature')}
                      {/* Display the date if it's available in data prop */}
                      {data?.sdcChairpersonDate && <span className="ml-2 text-sm text-gray-600">({data.sdcChairpersonDate})</span>}
                    </>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back
          </button>
          {!viewOnly && (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md text-white ${isSubmitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default R1;