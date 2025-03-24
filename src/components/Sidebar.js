import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="portal-info">
        <h2 className="portal-title">Applicant Portal</h2>
        <p className="portal-subtitle">Somaiya Vidyvihar University</p>
      </div>
      <nav className="sidebar-nav">
      <Link to="/ApplicationPortal" className="nav-item">Application Portal</Link>
        <div className="nav-item">
          <span>Application Status</span>
          <ul className="status-list">
            <li className="status-item">
              <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/21b0576cdebbc01918a2b72f8136f4660767e681" alt="Check Icon" className="status-icon" />
              <span>Pending</span>
            </li>
            <li className="status-item">
              <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/21b0576cdebbc01918a2b72f8136f4660767e681" alt="Check Icon" className="status-icon" />
              <span>Accepted</span>
            </li>
            <li className="status-item">
              <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/0fadc846ef5c12dfce54f7f08f18bd8b9238f485" alt="Cross Icon" className="status-icon" />
              <span>Rejected</span>
            </li>
          </ul>
        </div>
        <Link to="/faqs" className="nav-item">FAQ's</Link>
        <Link to="/contact" className="nav-item">Contact Us</Link>
      </nav>

      <style jsx>{`
        .sidebar {
          width: 250px;
          padding: 20px;
        }
        .portal-info {
          padding: 20px;
          text-align: center;
          margin-bottom: 20px;
          background-color: #d9d9d9;
        }
        .portal-title {
          font-weight: 500;
          margin-bottom: 5px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .nav-item {
          font-size: 20px;
          font-weight: 500;
          padding: 10px 0;
          border-bottom: 1px solid #000;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }
        .status-list {
          margin-left: 20px;
          font-size: 16px;
          list-style-type: none;
          padding: 0;
        }
        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0;
        }
        .status-icon {
          width: 20px;
          height: 20px;
        }
        @media (max-width: 640px) {
          .sidebar {
            width: 100%;
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
