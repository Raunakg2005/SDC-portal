import React, { useState } from 'react';
import './UG1Form.css';

const UG1Form = () => {
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectUtility: '',
    projectDescription: '',
    finance: '',
    guideName: '',
    employeeCode: '',
    amountClaimed: '',
    studentDetails: Array(4).fill({ srNo: '', branch: '', yearOfStudy: '', studentName: '', rollNumber: '' }),
  });

  const handleInputChange = (name, value) => {
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
      <h1 className="form-title">Under Graduate Form 1</h1>
      <p className="form-subtitle">In house Student Project with in Department</p>

      <form onSubmit={handleSubmit}>
        {/* Project Title */}
        <div className="form-field">
          <label>Title of the Project:</label>
          <input
            type="text"
            value={formData.projectTitle}
            onChange={(e) => handleInputChange('projectTitle', e.target.value)}
          />
        </div>

        {/* Utility of the Project */}
        <div className="form-field">
          <label>Utility of the Project:</label>
          <input
            type="text"
            value={formData.projectUtility}
            onChange={(e) => handleInputChange('projectUtility', e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="form-field">
          <label>Description:</label>
          <textarea
            value={formData.projectDescription}
            onChange={(e) => handleInputChange('projectDescription', e.target.value)}
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

        {/* Guide Name and Employee Code */}
        <div className="form-row">
          <div className="form-field">
            <label>Name of the Guide/Co-Guide:</label>
            <input
              type="text"
              value={formData.guideName}
              onChange={(e) => handleInputChange('guideName', e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Employee Code:</label>
            <input
              type="text"
              value={formData.employeeCode}
              onChange={(e) => handleInputChange('employeeCode', e.target.value)}
            />
          </div>
        </div>

        {/* Student Details Table */}
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
                <td>
                  <input
                    type="text"
                    value={student.srNo}
                    onChange={(e) => handleStudentDetailsChange(index, 'srNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={student.branch}
                    onChange={(e) => handleStudentDetailsChange(index, 'branch', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={student.yearOfStudy}
                    onChange={(e) => handleStudentDetailsChange(index, 'yearOfStudy', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={student.studentName}
                    onChange={(e) => handleStudentDetailsChange(index, 'studentName', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={student.rollNumber}
                    onChange={(e) => handleStudentDetailsChange(index, 'rollNumber', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Buttons */}
        <div className="button-container">
          <button type="button" className="upload-btn">Upload list of parts with price</button>
          <div className="signature-btns">
            <button type="button">Signature of Group Leader</button>
            <button type="button">Signature of Guide</button>
          </div>
          <div className="amount-container">
            <label>Amount claimed (INR):</label>
            <input type="text" value={formData.amountClaimed} onChange={(e) => handleInputChange('amountClaimed', e.target.value)} />
          </div>
          <button type="submit" className="submit-btn">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default UG1Form;
