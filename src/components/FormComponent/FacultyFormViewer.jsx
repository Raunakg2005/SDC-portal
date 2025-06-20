// components/faculty/FacultyFormViewer.jsx
import React from "react";
import { useParams } from "react-router-dom";
import FacUG1Viewing from "./FacUG1Viewing";
// import other form viewers as needed

const FacultyFormViewer = () => {
  const { formType, formId } = useParams();

  const renderFormComponent = () => {
    switch (formType.toLowerCase()) {
      case "ug1":
        return <FacUG1Viewing formId={formId} />;
      // case "ug2":
      //   return <FacUG2Viewing formId={formId} />;
      // case "pg1":
      //   return <FacPG1Viewing formId={formId} />;
      default:
        return <p>Unsupported form type: {formType}</p>;
    }
  };

  return (
    <div className="faculty-form-viewer">
      {renderFormComponent()}
    </div>
  );
};

export default FacultyFormViewer;
