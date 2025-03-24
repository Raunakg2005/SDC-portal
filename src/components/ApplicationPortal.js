import React from "react";
import { Routes, Route } from "react-router-dom"; // ✅ No extra Router
import Header from "./Header";
import Sidebar from "./Sidebar";
import ApplicationForms from "./ApplicationForms";
import FormPage from "./FormPage";
import ChatWidget from "./ChatWidget";
import FAQ from "../pages/FAQ";
import Contact from "../pages/Contact";
import UG1Form from "../forms/UG1Form";
import UGForm2 from "../forms/UGForm2";

const ApplicationPortal = () => {
  return (
    <div className="application-portal">
      <Header />
      <main className="main-content">
        <Sidebar />
        <Routes>
            <Route path="/" element={<ApplicationForms />} />
            <Route path="/forms/:id" element={<FormPage />} />
            <Route path="faqs" element={<FAQ />} /> {/* ✅ Relative path */}
            <Route path="contact" element={<Contact />} /> {/* ✅ Relative path */}
            <Route path="/UG1Form" element={<UG1Form />} />
            <Route path="/UGForm2" element={<UGForm2 />} />
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
  );
};

export default ApplicationPortal;
