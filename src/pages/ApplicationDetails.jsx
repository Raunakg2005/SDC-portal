import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import formMapper from "../components/FormComponent/FormMapper";

const ApplicationDetails = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://localhost:5000/api/application/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch application details (status ${res.status})`);
        const data = await res.json();
        setApplication(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchApplication();
  }, [id]);

  if (loading) return <div className="p-6">Loading application details...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!application) return <div className="p-6">No application found.</div>;

  const FormComponent = formMapper[application.formType];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Application Details</h1>
      <div className="mb-4 text-gray-600 space-y-1">
        <p><strong>Topic:</strong> {application.topic}</p>
        <p><strong>Applicant Roll No:</strong> {application.name}</p>
        <p><strong>Submitted on:</strong> {new Date(application.submitted).toLocaleDateString()}</p>
        <p><strong>Branch:</strong> {application.branch}</p>
        <p><strong>Form Type:</strong> {application.formType}</p>
        <p><strong>Status:</strong> {application.status}</p>
      </div>

      {FormComponent ? (
        <FormComponent data={application.formData} viewOnly={true} />
      ) : (
        <p className="text-red-500">Unknown form type: {application.formType}</p>
      )}
    </div>
  );
};

export default ApplicationDetails;
