import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../components/styles/facPending.css"; // Ensure this CSS file contains styles for modal and status badges

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
    <div className="main-wrapper">
      <Navbar />
      <Sidebar />
      <div className="page-wrapper">
        <div className="content-area p-6 max-w-6xl mx-auto">
          <h2 className="page-title text-3xl font-bold mb-6 text-gray-800">Dashboard</h2> {/* Main Dashboard Title */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Welcome to your application dashboard. Here's a quick overview of your application statuses and recent activities.
          </p>

          {/* --- Dashboard Stats Cards --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Applications Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Applications</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalApplications}</p>
              </div>
              <div className="text-4xl text-blue-500">
                <i className="fa-solid fa-list-check"></i> {/* Example icon, ensure Font Awesome is linked */}
              </div>
            </div>

            {/* Pending Applications Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{pendingApplications}</p>
              </div>
              <div className="text-4xl text-yellow-500">
                <i className="fa-solid fa-hourglass-half"></i> {/* Example icon */}
              </div>
            </div>

            {/* Accepted Applications Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Accepted</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{acceptedApplications}</p>
              </div>
              <div className="text-4xl text-green-500">
                <i className="fa-solid fa-circle-check"></i> {/* Example icon */}
              </div>
            </div>

            {/* Rejected Applications Card */}
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Rejected</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{rejectedApplications}</p>
              </div>
              <div className="text-4xl text-red-500">
                <i className="fa-solid fa-circle-xmark"></i> {/* Example icon */}
              </div>
            </div>
          </div>
          {/* --- End Dashboard Stats Cards --- */}

          <h3 className="page-subtitle text-2xl font-bold mb-4 text-gray-800">Recent Applications</h3> {/* Table Title */}

          <div className="table-wrapper overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
            <table className="custom-table min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Form Type</th>
                  <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Roll No.</th>
                  <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Submitted On</th>
                  <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Branch</th>
                  <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Remarks</th>
                  <th className="p-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-gray-500 py-6 text-base">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app._id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                      <td className="p-4 text-gray-800 font-medium">{app.formType || 'N/A'}</td>
                      <td className="p-4 text-gray-800">{app.name || 'N/A'}</td>
                      <td className="p-4 text-gray-700">
                        {app.rollNumber || app.rollNo || app.students?.[0]?.rollNo || app.studentDetails?.[0]?.rollNumber || "N/A"}
                      </td>
                      <td className="p-4 text-gray-700">
                        {new Date(app.submitted).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td className="p-4 text-gray-700">{app.branch || 'N/A'}</td>
                      <td className="p-4 text-gray-700">
                        <span className={`status-badge status-${app.status?.toLowerCase()}`}>
                          {app.status || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700">{app.remarks || 'No remarks provided.'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleViewClick(app._id)}
                          className="view-button bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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