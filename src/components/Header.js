import React from 'react';
import { Link } from 'react-router-dom';
import UserProfile from './UserProfile';

const Header = () => {
  return (
    <header className="header">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/f9859b5592b2e1b982f800234c1c4ab29d51df8a"
        alt="Somaiya Logo"
        className="logo"
      />
      <nav className="navigation">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/policy" className="nav-link">Policy</Link>
        <Link to="/logout" className="nav-link">Logout</Link>
      </nav>
      <UserProfile />
      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 5px solid #d9d9d9;
        }
        .logo {
          width: 336px;
          height: 119px;
        }
        .navigation {
          display: flex;
          gap: 20px;
          font-size: 24px;
          font-weight: 500;
        }
        .nav-link {
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }
        @media (max-width: 991px) {
          .header {
            padding: 15px;
          }
          .navigation {
            font-size: 20px;
          }
        }
        @media (max-width: 640px) {
          .navigation {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
