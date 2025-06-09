// src/pages/PendingApplications.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PendingApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // 1. Get user's branch from localStorage
        let userBranch = null;
        const userString = localStorage.getItem("user");
        if (userString) {
          try {
            const user = JSON.parse(userString);
            userBranch = user.branch;
          } catch (e) {
            console.error("Failed to parse user data from localStorage:", e);
            // Consider adding user-facing error or logout if localStorage is critical
          }
        }

        // 2. Construct the URL with the userBranch as a query parameter
        const baseUrl = "http://localhost:5000/api/application/pending";
        const url = userBranch ? `${baseUrl}?userBranch=${encodeURIComponent(userBranch)}` : baseUrl;

        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch pending applications: ${res.status} ${text}`);
        }
        const data = await res.json();
        setApplications(data);
      } catch (err) {
        console.error("Error in PendingApplications:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []); // Empty dependency array means this runs once on component mount

  const handleViewClick = (id) => {
    // When navigating to a specific application, also send the user's branch
    // so the detail page can use it for its API call.
    let userBranch = null;
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        userBranch = user.branch;
      } catch (e) {
        console.error("Failed to parse user data for view click:", e);
      }
    }
    const queryParam = userBranch ? `?userBranch=${encodeURIComponent(userBranch)}` : '';
    navigate(`/application/${id}${queryParam}`);
  };

  if (loading) return <div className="p-6">Loading pending applications...</div>;
  if (error)
    return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Pending Applications</h2>
      <p className="text-gray-600 mb-6">
        Easily track the details and statuses of all your submitted applications.
      </p>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full border text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Topic</th>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Submitted</th>
              <th className="p-3 border">Branch</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No pending applications found.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{app.topic}</td>
                  <td className="p-3">{app.name}</td>
                  <td className="p-3">
                    {new Date(app.submitted).toLocaleDateString()}
                  </td>
                  {/* This 'app.branch' now comes from the backend,
                      prioritizing the user's branch if sent. */}
                  <td className="p-3">{app.branch}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleViewClick(app._id)}
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingApplications;
