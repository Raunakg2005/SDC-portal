import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ApplicationPortal from "./components/ApplicationPortal";

const App = () => {
    return (
        <Routes>  {/* ✅ No extra <Router> here */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/ApplicationPortal" element={<ApplicationPortal />} />
        </Routes>
    );
};

export default App;
