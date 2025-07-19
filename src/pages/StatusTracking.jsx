import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../components/styles/StatusTracking.css";
import { Check, X, ChevronLeft, Clock } from "react-feather";

const StatusTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/facapplication/status-tracking/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            navigate('/dashboard');
            return;
          }
          throw new Error(`Failed to fetch application: ${res.status}`);
        }

        const data = await res.json();
        if (!data || !data.statusHistory) {
          throw new Error("Invalid application data received");
        }

        setApplication(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load application details");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [id, navigate]);

  const getStatusIcon = (status, isRejected, isPending) => {
    if (isRejected) return <X size={14} />;
    if (isPending) return <Clock size={14} />;
    return <Check size={14} />;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Pending';
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getWorkflowSteps = () => {
    return [
      { name: "Submitted", role: "Student" },
      { name: "Faculty Approval", role: "Faculty" },
      { name: "Department Approval", role: "Department Coordinator" },
      { name: "Institute Approval", role: "Institute Coordinator" },
      { name: "Completed", role: "System" }
    ];
  };

  const normalize = (str) => str.toLowerCase().replace(/_/g, " ").trim();

  const processTimeline = () => {
    if (!application || !application.statusHistory) return [];

    const workflowSteps = getWorkflowSteps();
    const timeline = [];
    let foundRejection = false;

    workflowSteps.forEach((step) => {
      if (foundRejection) {
        timeline.push({
          status: step.name,
          timestamp: null,
          details: "Step skipped due to rejection",
          changedBy: null,
          changedByRole: step.role,
          isRejected: false,
          isPending: true,
          isSkipped: true,
        });
        return;
      }

      const matchedHistory = application.statusHistory.find((entry) => {
        const entryStatus = normalize(entry.status);
        const stepName = normalize(step.name);

        if (entryStatus.includes('rejected') && entry.changedByRole === step.role) {
          return true;
        }

        return entryStatus.includes(stepName);
      });

      if (matchedHistory) {
        const isRejected = normalize(matchedHistory.status).includes('rejected');
        timeline.push({
          ...matchedHistory,
          isRejected,
          isPending: false,
          isSkipped: false,
        });

        if (isRejected) foundRejection = true;

      } else {
        timeline.push({
          status: step.name,
          timestamp: null,
          details: "Pending",
          changedBy: null,
          changedByRole: step.role,
          isRejected: false,
          isPending: true,
          isSkipped: false,
        });
      }
    });

    return timeline;
  };

  if (loading) {
    return (
      <div className="status-tracking-wrapper">
        <Navbar />
        <Sidebar />
        <div className="status-loading">
          <div className="p-6 text-center">Loading application details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-tracking-wrapper">
        <Navbar />
        <Sidebar />
        <div className="status-error">
          <div className="p-6 text-center">Error: {error}</div>
          <button
            onClick={() => navigate(-1)}
            className="status-error-button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="status-tracking-wrapper">
        <Navbar />
        <Sidebar />
        <div className="status-loading">
          <div className="p-6 text-center">Application not found</div>
        </div>
      </div>
    );
  }

  const timelineData = processTimeline();
  const currentStatus = application.status || 'Pending';

  return (
    <div className="status-tracking-wrapper">
      <Navbar />
      <Sidebar />
      <div className="status-tracking-content">
        <h2 className="page-title">Application Details & Status Tracking</h2>

        <div className="status-app-info">
          <h3>Application Information</h3>
          <div className="status-info-grid">
            <p className="status-info-item"><strong>Form Type:</strong> {application.formType || 'N/A'}</p>
            <p className="status-info-item"><strong>Name:</strong> {application.name || 'N/A'}</p>
            <p className="status-info-item"><strong>Roll No.:</strong> {application.rollNumber || 'N/A'}</p>
            <p className="status-info-item"><strong>Branch:</strong> {application.branch || 'N/A'}</p>
            <p className="status-info-item"><strong>Submitted On:</strong> {formatDateTime(application.createdAt || application.submitted)}</p>
            <p className="status-info-item"><strong>Current Status:</strong>
              <span className={`status-badge status-${currentStatus.toLowerCase()}`}>{currentStatus}</span>
            </p>
            <p className="status-info-item md:col-span-2"><strong>Remarks:</strong> {application.remarks || 'No remarks provided.'}</p>
          </div>
        </div>

        <div className="status-timeline">
          <h3>Application Status History</h3>
          <div className="timeline-container">
            {timelineData.map((item, index) => {
              const { status, timestamp, details, changedBy, changedByRole, isRejected, isPending, isSkipped } = item;

              const statusClass = isRejected ? 'rejected' :
                                  isPending && isSkipped ? 'skipped' :
                                  isPending ? 'pending' : 'completed';

              return (
                <div key={index} className={`timeline-item ${statusClass}`}>
                  <div className={`timeline-icon ${statusClass}`}>
                    {getStatusIcon(status, isRejected, isPending)}
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-date">
                      {timestamp ? formatDateTime(timestamp) : (isSkipped ? "Skipped" : "Pending")}
                    </p>
                    <h4 className="timeline-status">
                      {status}
                      {isRejected && <span className="ml-2 text-sm font-normal text-red-600">(Rejected)</span>}
                      {isPending && !isSkipped && <span className="ml-2 text-sm font-normal text-blue-600">(Pending)</span>}
                    </h4>
                    <p className="timeline-details">
                      {details}
                    </p>
                    {(changedBy || changedByRole) && !isPending && (
                      <p className="timeline-changedby">
                        By: {changedBy || 'System'} ({changedByRole || 'System'})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate(-1)}
            className="status-back-button"
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusTracking;
