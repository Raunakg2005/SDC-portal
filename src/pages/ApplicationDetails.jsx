// src/pages/ApplicationDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import formMapper from "../components/FormComponent/FormMapper";

const ApplicationDetails = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Added navigate, though not used in this specific fetch logic.

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Get user's branch from localStorage
        let userBranch = null;
        const userString = localStorage.getItem("user");
        if (userString) {
          try {
            const user = JSON.parse(userString);
            userBranch = user.branch;
          } catch (e) {
            console.error("Failed to parse user data from localStorage for ApplicationDetails:", e);
            // Consider adding user-facing error or logout if localStorage is critical
          }
        }

        // 2. Construct the URL with the userBranch as a query parameter
        const baseUrl = `http://localhost:5000/api/application/${id}`;
        const url = userBranch ? `${baseUrl}?userBranch=${encodeURIComponent(userBranch)}` : baseUrl;

        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch application details (status ${res.status}): ${text}`);
        }
        const data = await res.json();
        setApplication(data); // full form data directly
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchApplication();
  }, [id]); // Dependency array: Re-run if 'id' changes

  if (loading) return <div className="p-6">Loading application details...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!application) return <div className="p-6">No application found.</div>;

  // Ensure FormComponent is defined before rendering
  const FormComponent = formMapper[application.formType];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Application Details</h1>
      <div className="mb-4 text-gray-600 space-y-1">
        {/* Use application.topic as the primary display, falling back to projectTitle if topic is undefined */}
        <p><strong>Topic:</strong> {application.topic || application.projectTitle || 'N/A'}</p>
        {/* Use application.name as the primary display, falling back to other possible fields if name is undefined */}
        <p><strong>Applicant Name:</strong> {application.name || 'N/A'}</p>
        <p><strong>Submitted on:</strong> {new Date(application.submitted).toLocaleDateString()}</p>
        {/* The branch field will now come from the backend's processed data,
            which prioritizes the user's branch from localStorage */}
        <p><strong>Branch:</strong> {application.branch || 'N/A'}</p>
        <p><strong>Form Type:</strong> {application.formType || 'N/A'}</p>
        <p><strong>Status:</strong> {application.status || 'N/A'}</p>
      </div>

      {FormComponent ? (
        <FormComponent data={application} viewOnly={true} />
      ) : (
        <p className="text-red-500">Unknown form type: {application.formType}</p>
      )}
    </div>
  );
};

export default ApplicationDetails;
