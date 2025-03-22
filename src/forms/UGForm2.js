import React, { useState } from 'react';
import './UGForm2.css';

const UGForm2 = () => {
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectUtility: '',
    projectDescription: '',
    finance: '',
    guideName: '',
    employeeCode: '',
    amountClaimed: '',
    studentDetails: [
      { srNo: '', branch: '', yearOfStudy: '', studentName: '', rollNumber: '' },
      { srNo: '', branch: '', yearOfStudy: '', studentName: '', rollNumber: '' },
      { srNo: '', branch: '', yearOfStudy: '', studentName: '', rollNumber: '' },
      { srNo: '', branch: '', yearOfStudy: '', studentName: '', rollNumber: '' },
    ],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleStudentDetailsChange = (index, field, value) => {
    const newStudentDetails = [...formData.studentDetails];
    newStudentDetails[index][field] = value;
    setFormData((prevState) => ({
      ...prevState,
      studentDetails: newStudentDetails,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Under Graduate Form 2</h1>
      <h2 className="form-subtitle">
        In-House ( FY to LY Students) Interdisciplinary projects
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Project Title */}
        <div className="form-group">
          <label htmlFor="projectTitle" className="form-label">
            Title of the Project :
          </label>
          <input
            type="text"
            id="projectTitle"
            name="projectTitle"
            value={formData.projectTitle}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        {/* Project Utility */}
        <div className="form-group">
          <label htmlFor="projectUtility" className="form-label">
            Utility of the Project:
          </label>
          <input
            type="text"
            id="projectUtility"
            name="projectUtility"
            value={formData.projectUtility}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="projectDescription" className="form-label">
            Description :
          </label>
          <textarea
            id="projectDescription"
            name="projectDescription"
            value={formData.projectDescription}
            onChange={handleInputChange}
            className="form-textarea"
            required
          />
        </div>

        {/* Finance */}
        <div className="form-field">
          <label>Whether received finance from any other agency:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="Yes"
                checked={formData.finance === 'Yes'}
                onChange={() => handleInputChange('finance', 'Yes')}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                value="No"
                checked={formData.finance === 'No'}
                onChange={() => handleInputChange('finance', 'No')}
              />
              No
            </label>
          </div>
        </div>   
        
        {/* Guide Info */}
        <div className="form-group guide-info">
          <div>
            <label htmlFor="guideName" className="form-label">
              Name of the Guide/Co-Guide :
            </label>
            <input
              type="text"
              id="guideName"
              name="guideName"
              value={formData.guideName}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="employeeCode" className="form-label">
              Employee Code :
            </label>
            <input
              type="text"
              id="employeeCode"
              name="employeeCode"
              value={formData.employeeCode}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Student Details */}
        <div className="student-details">
          <h3 className="student-title">Student Details</h3>
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
                  {Object.keys(student).map((field) => (
                    <td key={field}>
                      <input
                        type="text"
                        value={student[field]}
                        onChange={(e) =>
                          handleStudentDetailsChange(index, field, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature & Amount */}
        <div className="form-footer">
          <button type="button" className="signature-btn">
            Signature of Group Leader
          </button>
          <button type="button" className="signature-btn">
            Signature of Guide
          </button>
          <div className="amount-section">
            <label htmlFor="amountClaimed" className="form-label">
              Amount claimed (INR):
            </label>
            <input
              type="number"
              id="amountClaimed"
              name="amountClaimed"
              value={formData.amountClaimed}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
};

export default UGForm2;
