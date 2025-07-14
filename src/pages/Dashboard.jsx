import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../components/styles/dashboard.css"; // Ensure this CSS file contains styles for modal and status badges

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  /**
   * Fetches applications (pending, accepted, rejected) for the current user.
   * Consolidates them into a single list.
   */
  const fetchApplications = async (svvNetId) => {
    setLoading(true);
    setError(null);
    console.log(`Fetching applications for svvNetId: ${svvNetId}`);

    try {
      const token = localStorage.getItem('token'); // Assuming token is needed for authenticated access

      // Fetch pending applications
      const pendingRes = await fetch(`http://localhost:5000/api/facapplication/pending?svvNetId=${svvNetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!pendingRes.ok) throw new Error(`HTTP error fetching pending! Status: ${pendingRes.status}`);
      const pendingData = await pendingRes.json();
      console.log("Pending Applications:", pendingData);

      // Fetch accepted applications
      const acceptedRes = await fetch(`http://localhost:5000/api/facapplication/accepted?svvNetId=${svvNetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!acceptedRes.ok) throw new Error(`HTTP error fetching accepted! Status: ${acceptedRes.status}`);
      const acceptedData = await acceptedRes.json();
      console.log("Accepted Applications:", acceptedData);

      // Fetch rejected applications
      const rejectedRes = await fetch(`http://localhost:5000/api/facapplication/rejected?svvNetId=${svvNetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!rejectedRes.ok) throw new Error(`HTTP error fetching rejected! Status: ${rejectedRes.status}`);
      const rejectedData = await rejectedRes.json();
      console.log("Rejected Applications:", rejectedData);

      // Combine all applications
      const allApplications = [...pendingData, ...acceptedData, ...rejectedData];
      // Sort applications by submission date, newest first
      allApplications.sort((a, b) => new Date(b.submitted) - new Date(a.submitted));

      setApplications(allApplications);
    } catch (err) {
      console.error("Error fetching student applications:", err);
      setError(err.message);
      if (err.message.includes('401') || err.message.includes('403')) {
        // Redirect to login if unauthorized/forbidden
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load user from localStorage on component mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        if (user.svvNetId) {
          fetchApplications(user.svvNetId);
        } else {
          console.error("User object in localStorage does not contain svvNetId.");
          setError("User ID not found. Please log in again.");
          setLoading(false);
          navigate('/'); // Redirect to login
        }
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        setError("Error loading user data. Please log in again.");
        setLoading(false);
        navigate('/'); // Redirect to login
      }
    } else {
      console.log("No 'user' found in localStorage. Redirecting to login.");
      setLoading(false);
      navigate('/'); // Redirect to login
    }
  }, [navigate]);

  const handleViewClick = (id) => {
    navigate(`/status-tracking/${id}`); // Changed route to status-tracking
  };

  // --- Calculate Dashboard Statistics ---
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status?.toLowerCase() === 'pending').length;
  const acceptedApplications = applications.filter(app => app.status?.toLowerCase() === 'accepted').length;
  const rejectedApplications = applications.filter(app => app.status?.toLowerCase() === 'rejected').length;


  if (loading) {
    return (
      <div className="main-wrapper">
        <Navbar />
        <Sidebar />
        <div className="page-wrapper flex justify-center items-center min-h-screen">
          <div className="p-6 text-center text-lg text-gray-700">Loading your dashboard...</div>
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
              onClick={() => navigate('/')} // Or navigate to a refresh button/page
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Go to Login
            </button>
          </div>
        </div>
       </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-main">
          <h2 className="dashboard-title">Dashboard</h2>
          <p className="dashboard-description">
            Welcome to your application dashboard. Here's a quick overview of your application statuses and recent activities.
          </p>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card total-apps">
              <div>
                <p className="stat-label">Total Applications</p>
                <p className="stat-value">{totalApplications}</p>
              </div>
              <div className="stat-icon">
                <i className="fa-solid fa-list-check"></i>
              </div>
            </div>

            <div className="stat-card pending-apps">
              <div>
                <p className="stat-label">Pending</p>
                <p className="stat-value">{pendingApplications}</p>
              </div>
              <div className="stat-icon">
                <i className="fa-solid fa-hourglass-half"></i>
              </div>
            </div>

            <div className="stat-card accepted-apps">
              <div>
                <p className="stat-label">Accepted</p>
                <p className="stat-value">{acceptedApplications}</p>
              </div>
              <div className="stat-icon">
                <i className="fa-solid fa-circle-check"></i>
              </div>
            </div>

            <div className="stat-card rejected-apps">
              <div>
                <p className="stat-label">Rejected</p>
                <p className="stat-value">{rejectedApplications}</p>
              </div>
              <div className="stat-icon">
                <i className="fa-solid fa-circle-xmark"></i>
              </div>
            </div>
          </div>

          <h3 className="table-title">Recent Applications</h3>

          <div className="applications-table-container">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Form Type</th>
                  <th>Name</th>
                  <th>Roll No.</th>
                  <th>Submitted On</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-applications">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app._id}>
                      <td>{app.formType || 'N/A'}</td>
                      <td>{app.name || 'N/A'}</td>
                      <td>
                        {app.rollNumber || app.rollNo || app.students?.[0]?.rollNo || app.studentDetails?.[0]?.rollNumber || "N/A"}
                      </td>
                      <td>
                        {new Date(app.submitted).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td>{app.branch || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${app.status?.toLowerCase()}`}>
                          {app.status || 'N/A'}
                        </span>
                      </td>
                      <td>{app.remarks || 'No remarks provided.'}</td>
                      <td>
                        <button
                          onClick={() => handleViewClick(app._id)}
                          className="view-button"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;