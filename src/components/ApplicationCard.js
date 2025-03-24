import React from 'react';
import { useNavigate } from 'react-router-dom';

const ApplicationCard = ({ id, title, description }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/ApplicationPortal/forms/${id}`);
  };

  return (
    <div className="application-card" onClick={handleNavigate}>
      <h2 className="card-title">{title}</h2>
      <p className="card-description">{description}</p>
      <style jsx>{`
        .application-card {
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 8px;
          transition: 0.3s ease;
          cursor: pointer;
          background-color: #f9f9f9;
        }
        .application-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .card-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .card-description {
          font-size: 16px;
          color: #555;
        }
      `}</style>
    </div>
  );
};

export default ApplicationCard;
