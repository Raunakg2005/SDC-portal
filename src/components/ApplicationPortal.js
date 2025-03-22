import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ApplicationForms from './ApplicationForms';
import FormPage from './FormPage';
import ChatWidget from './ChatWidget';
import FAQ from '../pages/FAQ';
import Contact from '../pages/Contact';

const ApplicationPortal = () => {
  return (
    <Router>
      <div className="application-portal">
        <Header />
        <main className="main-content">
          <Sidebar />
          <Routes>
            <Route path="/" element={<ApplicationForms />} />
            <Route path="/forms/:id" element={<FormPage />} />
            <Route path="/faqs" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <ChatWidget />
        <style jsx>{`
          .application-portal {
            font-family: "Fira Sans", sans-serif;
            min-height: 100vh;
            background-color: #fff;
          }
          .main-content {
            display: flex;
            padding: 20px;
          }
          @media (max-width: 640px) {
            .main-content {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </Router>
  );
};

export default ApplicationPortal;
