import React from 'react';
import { useParams } from 'react-router-dom';
import UG1Form from '../forms/UG1Form';
import UGForm2 from '../forms/UGForm2';

const FormPage = () => {
  const { id } = useParams();

  const renderForm = () => {
    switch (id) {
      case 'UG_1':
        return <UG1Form />;
      case 'UG_2':
        return <UGForm2 />;
      // Add more cases for other forms
      default:
        return <div>No form available</div>;
    }
  };

  return (
    <div className="form-container">
      {renderForm()}
    </div>
  );
};

export default FormPage;
