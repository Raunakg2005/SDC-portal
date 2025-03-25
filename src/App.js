import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ApplicationPortal from "./components/ApplicationPortal";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import ExpenseUpload from "./forms/ExpenseUpload";


const PrivateRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem("token");
  return isAuthenticated ? element : <Navigate to="/login" />;
};


const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/ApplicationPortal" />} />
      <Route path="/ApplicationPortal/*" element={<PrivateRoute element={<ApplicationPortal />} />} />
      <Route path="/faqs" element={<PrivateRoute element={<FAQ />} />} />
      <Route path="/contact" element={<PrivateRoute element={<Contact />} />} />
      <Route path="/ExpenseUpload" element={<ExpenseUpload />} />
    </Routes>
  );
};

export default App;
