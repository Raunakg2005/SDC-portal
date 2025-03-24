import React from 'react';
import { useParams } from 'react-router-dom';
import UG1Form from '../forms/UG1Form';
import UGForm2 from '../forms/UGForm2';

// Map form IDs to their respective components
const formComponents = {
  UG_1: UG1Form,
  UG_2: UGForm2,
};

const FormPage = () => {
  const { id } = useParams();
  const SelectedForm = formComponents[id]; // Get the corresponding form component

  return (
    <div className="form-container">
      {SelectedForm ? <SelectedForm /> : <div className="error-message">No form available for ID: {id}</div>}
      
      {/* ✅ FIXED: Removed invalid `jsx` attribute */}
      <style>
        {`
          .form-container {
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
          }
          .error-message {
            text-align: center;
            color: red;
            font-size: 18px;
            font-weight: bold;
          }
        `}
      </style>
    </div>
  );
};

export default FormPage;
