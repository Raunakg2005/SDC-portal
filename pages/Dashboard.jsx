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
   * Helper function to get the branch from various possible locations in an application object.
   * This provides a more robust display on the frontend by prioritizing nested student branch.
   * @param {Object} app The application object.
   * @returns {string} The branch name or 'N/A' if not found.
   */
  const getBranchForDisplay = (app) => {
    return (
      app.students?.[0]?.branch || // Prioritize nested in students array
      app.studentDetails?.[0]?.branch || // Prioritize nested in studentDetails array
      app.branch || // Fallback to top-level 'branch' field
      app.department || // Fallback to 'department' field
      "N/A"
    );
  };

  /**
   * Fetches applications based on the current user's role.
   * Consolidates them into a single list for display.
   */
  const fetchApplications = async (user) => {
    setLoading(true);
    setError(null);
    console.log(`Fetching applications for role: ${user?.role}`);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      let fetchedData = [];

      if (!user) {
        throw new Error("User data not available. Please log in.");
      }

      // Keep original role for logging to see what's coming from localStorage
      const originalRole = user.role;
      // Normalize the user role for consistent matching: lowercase, trim, replace spaces with underscores
      const normalizedRole = originalRole ? String(originalRole).toLowerCase().trim().replace(/\s+/g, '_') : '';

      console.log("fetchApplications - Original Role from user object:", originalRole, "Normalized Role:", normalizedRole);

      // Base URL for API calls
      const baseURL = "http://localhost:5000/api/facapplication";

      switch (normalizedRole) {
        case 'student':
          // Students fetch all their applications from a single endpoint
          const studentRes = await fetch(`${baseURL}/all-by-svvnetid?svvNetId=${user.svvNetId}`, { headers });
          if (!studentRes.ok) throw new Error(`HTTP error fetching student apps! Status: ${studentRes.status}`);
          fetchedData = await studentRes.json();
          break;

        case 'faculty':
        case 'validator':
        case 'dept_coordinator':
        case 'department_coordinator': // Explicitly handle both forms
        case 'hod': // Added case for 'hod' role
        case 'institute_coordinator':
        case 'admin':
          // These roles now fetch from the new /applications-by-role endpoint
          // The backend's buildRoleBasedFilter will handle the specific filtering for each role (e.g., by branch for dept_coordinator)
          // By not providing a 'status' query param, this route will return all applications for the given role.
          const roleBasedRes = await fetch(`${baseURL}/applications-by-role`, { headers });
          if (!roleBasedRes.ok) throw new Error(`HTTP error fetching role-based apps! Status: ${roleBasedRes.status}`);
          fetchedData = await roleBasedRes.json();
          break;

        default:
          console.warn("Unknown user role in fetchApplications switch:", originalRole); // Log the original role that caused the issue
          setError("Unknown user role. Cannot fetch applications.");
          setLoading(false);
          return;
      }

      console.log("Applications fetched:", fetchedData);

      // Sort applications by submission date, newest first
      fetchedData.sort((a, b) => new Date(b.submitted) - new Date(a.submitted));
      setApplications(fetchedData);

    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err.message);
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('User data not available')) {
        // Redirect to login if unauthorized/forbidden or user data is missing
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log("useEffect - Raw user role from localStorage:", user.role); // New console log
        setCurrentUser(user);
        fetchApplications(user); // Call fetchApplications with the user object
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        setError("Error loading user data. Please log in again.");
        setLoading(false);
        navigate('/');
      }
    } else {
      console.log("No 'user' found in localStorage. Redirecting to login.");
      setLoading(false);
      navigate('/');
    }
  }, [navigate]); // navigate is a dependency

  const handleViewClick = (id) => {
    navigate(`/status-tracking/${id}`);
  };

  // --- Calculate Dashboard Statistics ---
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status?.toLowerCase() === 'pending').length;
  const acceptedApplications = applications.filter(app => {
    const statusLower = app.status?.toLowerCase();
    return statusLower === 'accepted' || statusLower === 'approved';
  }).length;
  const rejectedApplications = applications.filter(app => app.status?.toLowerCase() === 'rejected').length;

  // Dynamic content based on user role
  const getDashboardContent = (role) => {
    // Handle cases where 'role' might be undefined initially
    const originalRole = role;
    // Normalize the role string for consistent matching: lowercase, trim, replace spaces with underscores
    const normalizedRole = originalRole ? String(originalRole).toLowerCase().trim().replace(/\s+/g, '_') : '';

    console.log("getDashboardContent - Original Role:", originalRole, "Normalized Role:", normalizedRole);

    switch (normalizedRole) {
      case 'student':
        return {
          title: "Student Dashboard",
          description: "Here's an overview of all your submitted applications and their current statuses.",
        };
      case 'faculty':
        return {
          title: "Faculty Dashboard",
          description: "Overview of all applications relevant to you, including those awaiting your approval.",
        };
      case 'validator':
        return {
          title: "Validator Dashboard",
          description: "Overview of all applications awaiting validation or review.",
        };
      case 'dept_coordinator':
      case 'department_coordinator': // Explicitly handle both forms
      case 'hod': // Added case for 'hod' role
        return {
          title: `Department Coordinator Dashboard (${currentUser?.branch || 'N/A'})`,
          description: `Overview of applications for the ${currentUser?.branch || 'your'} department.`,
        };
      case 'institute_coordinator':
        return {
          title: "Institute Coordinator Dashboard",
          description: "Comprehensive overview of all applications across the institute.",
        };
      case 'admin':
        return {
          title: "Admin Dashboard",
          description: "Full administrative overview of all applications.",
        };
      default:
        console.warn("Unknown or unhandled user role in getDashboardContent switch:", originalRole); // Log the original role
        return {
          title: "Dashboard",
          description: "Welcome to your application dashboard.",
        };
    }
  };

  const dashboardInfo = getDashboardContent(currentUser?.role);

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

  return (
    <div className="dashboard-container">
      <Navbar />
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-main">
          <h2 className="dashboard-title">{dashboardInfo.title}</h2>
          <p className="dashboard-description">
            {dashboardInfo.description}
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
                      <td>{getBranchForDisplay(app)}</td> {/* Using the new helper function */}
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