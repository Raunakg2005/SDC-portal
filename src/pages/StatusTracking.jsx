import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../components/styles/facPending.css"; // Reusing CSS for general styles, you might add a specific CSS for this page

const StatusTracking = () => { // Renamed component
  const { id } = useParams(); // Get the application ID from the URL
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token'); // Assuming token is needed for authenticated access
        const res = await fetch(`http://localhost:5000/api/facapplication/status-tracking/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // Unauthorized or Forbidden, redirect to login
            navigate('/');
            return;
          }
          throw new Error(`HTTP error! Status: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setApplication(data);
      } catch (err) {
        console.error("Error fetching application details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchApplicationDetails();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="main-wrapper">
        <Navbar />
        <Sidebar />
        <div className="page-wrapper flex justify-center items-center min-h-screen">
          <div className="p-6 text-center text-lg text-gray-700">Loading application details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-wrapper">
        <Navbar />
        <Sidebar />
        <div className="page-wrapper flex justify-center items-center min-h-screen">
          <div className="p-6 text-center text-red-600 text-lg">Error: {error}. Please try again later.</div>
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="main-wrapper">
        <Navbar />
        <Sidebar />
        <div className="page-wrapper flex justify-center items-center min-h-screen">
          <div className="p-6 text-center text-gray-700">Application not found.</div>
        </div>
      </div>
    );
  }

  // Helper to format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="main-wrapper">
      <Navbar />
      <Sidebar />
      <div className="page-wrapper">
        <div className="content-area p-6 max-w-4xl mx-auto">
          <h2 className="page-title text-3xl font-bold mb-6 text-gray-800">Application Details & Status Tracking</h2> {/* Updated Title */}

          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Application Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <p><strong>Form Type:</strong> {application.formType || 'N/A'}</p>
              <p><strong>Name:</strong> {application.name || 'N/A'}</p>
              <p><strong>Roll No.:</strong> {application.rollNumber || application.rollNo || application.students?.[0]?.rollNo || application.studentDetails?.[0]?.rollNumber || "N/A"}</p>
              <p><strong>Branch:</strong> {application.branch || 'N/A'}</p>
              <p><strong>Submitted On:</strong> {formatDateTime(application.createdAt || application.submitted)}</p>
              <p><strong>Current Status:</strong> <span className={`status-badge status-${application.status?.toLowerCase()}`}>{application.status || 'N/A'}</span></p>
              <p className="md:col-span-2"><strong>Remarks:</strong> {application.remarks || 'No remarks provided.'}</p>
              {application.documents && application.documents.length > 0 && (
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-lg font-semibold mb-2">Attached Documents:</h4>
                  <ul className="list-disc list-inside">
                    {application.documents.map((doc, index) => (
                      <li key={index} className="text-blue-600 hover:underline">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          {doc.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* --- Status Tracking Timeline --- */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">Application Status History</h3>
            {application.statusHistory && application.statusHistory.length > 0 ? (
              <div className="relative border-l-2 border-gray-200 ml-4 pl-6">
                {/* Sort status history by timestamp in ascending order for a proper timeline */}
                {application.statusHistory
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  .map((history, index) => (
                    <div key={index} className="mb-8 flex items-start">
                      <div className="absolute w-4 h-4 bg-blue-500 rounded-full -left-2 top-0 mt-1.5 border-2 border-white"></div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-500">{formatDateTime(history.timestamp)}</p>
                        <h4 className="text-lg font-semibold text-gray-800 mt-1">{history.status.replace(/_/g, ' ').toUpperCase()}</h4>
                        <p className="text-gray-700 mt-1">{history.details || 'No details provided.'}</p>
                        {history.changedBy && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            By: {history.changedBy} ({history.changedByRole || 'N/A'})
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600">No detailed status history available for this application.</p>
            )}
          </div>
          {/* --- End Status Tracking Timeline --- */}

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(-1)} // Go back to the previous page (e.g., Dashboard)
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusTracking; 