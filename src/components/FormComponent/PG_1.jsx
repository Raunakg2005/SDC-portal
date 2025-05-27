import React, { useState } from 'react';
import axios from "axios";

const PG_1 = ({ readonly = false }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    yearOfAdmission: '',
    feesPaid: 'No',
    sttpTitle: '',
    guideName: '',
    coGuideName: '',
    numberOfDays: '',
    dateFrom: '',
    dateTo: '',
    organization: '',
    reason: '',
    knowledgeUtilization: '',
    bankDetails: {
      beneficiary: '',
      ifsc: '',
      bankName: '',
      branch: '',
      accountType: '',
      accountNumber: ''
    },
    registrationFee: '',
    previousClaim: 'No',
    claimDate: '',
    amountReceived: '',
    amountSanctioned: '',
    status: 'pending' 
  });

  const [files, setFiles] = useState({
    receiptCopy: null,
    additionalDocuments: null,
    guideSignature: null
  });

  const handleChange = (e) => {
    if (readonly) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    if (readonly) return;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  const handleFileChange = (field, e) => {
    if (readonly) return;
    setFiles(prevFiles => ({
      ...prevFiles,
      [field]: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readonly) return;
  
    try {
      const formPayload = new FormData();
  
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "bankDetails") {
          formPayload.append(key, value);
        }
      });
      formPayload.append("bankDetails", JSON.stringify(formData.bankDetails));
  
      if (files.receiptCopy) formPayload.append("receiptCopy", files.receiptCopy);
      if (files.additionalDocuments) formPayload.append("additionalDocuments", files.additionalDocuments);
      if (files.guideSignature) formPayload.append("guideSignature", files.guideSignature);
  
      const response = await axios.post(
        "http://localhost:5000/api/pg1form/submit",
        formPayload
      );
  
      alert("Form submitted successfully!");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form. Please try again.");
    }
  };
  
  return (
    <div className="form-container max-w-4xl mx-auto p-5 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Post Graduate Form 1 - Workshop/STTP {readonly && "(View Only)"}
      </h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center underline">Application Form</h2>
        
        {/* Student Information */}
        <table className="w-full mb-6 border border-gray-300">
          <tbody>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Name of the Student</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Year of Admission</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="yearOfAdmission"
                  value={formData.yearOfAdmission}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Whether Paid fees for Current Academic Year</th>
              <td className="p-2 border border-gray-300">
                <select
                  name="feesPaid"
                  value={formData.feesPaid}
                  onChange={handleChange}
                  disabled={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Title of the STTP/Workshop</th>
              <td colSpan="5" className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="sttpTitle"
                  value={formData.sttpTitle}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Guide and Workshop Information */}
        <table className="w-full mb-6 border border-gray-300">
          <tbody>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Name of the Guide / Co-guide</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="guideName"
                  value={formData.guideName}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Number of days of Workshop/STTP</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="number"
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">From Date</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="date"
                  name="dateFrom"
                  value={formData.dateFrom}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">To Date</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="date"
                  name="dateTo"
                  value={formData.dateTo}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Organization Information */}
        <table className="w-full mb-6 border border-gray-300">
          <tbody>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Name and address of organization / institution conducting Workshop/STTP (For address one may give website address)</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Reason for attending the Workshop/STTP</th>
              <td className="p-2 border border-gray-300">
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded h-20 ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">How will you utilize the knowledge gained?</th>
              <td className="p-2 border border-gray-300">
                <textarea
                  name="knowledgeUtilization"
                  value={formData.knowledgeUtilization}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded h-20 ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm italic mb-6 text-gray-600">Attach a copy of authentic Receipt mentioning the Registration fees along with the Reimbursement Form</p>

        {/* Bank Details */}
        <table className="w-full mb-6 border border-gray-300">
          <tbody>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100" colSpan="2">Bank details for RTGS/NEFT</th>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Beneficiary name, brief address and mobile no. (Student author)</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="beneficiary"
                  value={formData.bankDetails.beneficiary}
                  onChange={handleBankChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment Information */}
        <table className="w-full mb-6 border border-gray-300">
          <tbody>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Registration Fees Paid</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Rs.___________"
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Have you claimed previously for any paper / project competition under this scheme:</th>
              <td className="p-2 border border-gray-300">
                <select
                  name="previousClaim"
                  value={formData.previousClaim}
                  onChange={handleChange}
                  disabled={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Date of Received Claim</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="date"
                  name="claimDate"
                  value={formData.claimDate}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </td>
              <th className="p-2 border border-gray-300 bg-gray-100">Amount Received</th>
              <td className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="amountReceived"
                  value={formData.amountReceived}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Rs.___________"
                />
              </td>
            </tr>
            <tr>
              <th className="p-2 border border-gray-300 bg-gray-100">Amount sanctioned</th>
              <td colSpan="7" className="p-2 border border-gray-300">
                <input
                  type="text"
                  name="amountSanctioned"
                  value={formData.amountSanctioned}
                  onChange={handleChange}
                  readOnly={readonly}
                  className={`w-full p-1 border border-gray-300 rounded ${readonly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Rs.___________"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* File Uploads */}
        <div className="mb-6 space-y-4">
          {!readonly ? (
            <>
              <div>
                <label className="block font-semibold mb-2">Attach receipt of registration fees:</label>
                <div className="flex items-center">
                  <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                    Choose Receipt Copy
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange('receiptCopy', e)}
                    />
                  </label>
                  <span className="ml-2 text-sm">
                    {files.receiptCopy ? files.receiptCopy.name : "No file chosen"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Additional Documents:</label>
                <div className="flex items-center">
                  <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                    Choose Additional Documents
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange('additionalDocuments', e)}
                    />
                  </label>
                  <span className="ml-2 text-sm">
                    {files.additionalDocuments ? files.additionalDocuments.name : "No file chosen"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Guide Signature:</label>
                <div className="flex items-center">
                  <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                    Choose Guide Signature
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange('guideSignature', e)}
                    />
                  </label>
                  <span className="ml-2 text-sm">
                    {files.guideSignature ? files.guideSignature.name : "No file chosen"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="block font-semibold mb-2">Receipt Copy:</label>
                <span className="text-sm text-gray-600">
                  {files.receiptCopy ? files.receiptCopy.name : "No file attached"}
                </span>
              </div>
              <div>
                <label className="block font-semibold mb-2">Additional Documents:</label>
                <span className="text-sm text-gray-600">
                  {files.additionalDocuments ? files.additionalDocuments.name : "No file attached"}
                </span>
              </div>
              <div>
                <label className="block font-semibold mb-2">Guide Signature:</label>
                <span className="text-sm text-gray-600">
                  {files.guideSignature ? files.guideSignature.name : "No file attached"}
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Form Actions */}   
        <div className="flex justify-between">
        {!readonly && (
           <button onClick={handleSubmit} className="submit-btn bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
           Submit
         </button>
        )} 
        {!readonly && (
           <button onClick={() => window.history.back()} className="back-btn bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600">
           Back
          </button>
        )}    
        </div>
      </div>
    </div>
  );
};

export default PG_1;