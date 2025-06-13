import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Keep axios for future API integration
import "./login.css";
import logo from "../assets/somaiya-logo.png";
import logo1 from "../assets/trust.png";
import googleIcon from "../assets/google-logo.jpg";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // --- TEMPORARY: Hardcoded credentials with roles and branch for testing ---
    const hardcodedUsers = {
      "devanshu.d": { password: "Devanshu123", role: "admin", branch: "(AI & DS)" }, // Example: 'admin' role
      "sohamgore": { password: "12345678", role: "student", branch: "COMPS" },   // Example: 'student' role
      "faculty.a": { password: "faculty123", role: "faculty", branch: "COMPS" }, // Example: 'faculty' role
      // Add more hardcoded users and their roles/branches as needed for development
    };

    const userEntry = hardcodedUsers[username];

    if (userEntry && userEntry.password === password) {
      // Store user details including role AND branch in localStorage
      localStorage.setItem("svvNetId", username);
      localStorage.setItem("user", JSON.stringify({
        svvNetId: username,
        role: userEntry.role,
        branch: userEntry.branch // Add branch here
      }));

      console.log("Stored svvNetId:", localStorage.getItem("svvNetId")); // Debugging
      console.log("Stored user role:", userEntry.role); // Debugging
      console.log("Stored user branch:", userEntry.branch); // Debugging

      // Redirect based on role or to a general home page
      // You can add more complex routing logic here if needed,
      // e.g., navigate('/admin-dashboard') for admins
      navigate("/home");
    } else {
      setError("Invalid SVV Net ID or password.");
    }

    // --- SPACE FOR DATABASE INTEGRATION ---
    // If you plan to use an API for authentication, uncomment and adjust the following block.
    // This provides a clear section for your backend logic.
    /*
    try {
      // Replace with your actual API endpoint and request body as per your backend
      const res = await axios.post("http://localhost:5000/api/auth/login", { 
        svvNetId: username, 
        password: password 
      });

      // Assuming your API returns user data including role AND branch upon successful login
      // Example response structure: { token: "...", user: { svvNetId: "...", role: "student", branch: "..." } }
      if (res.status === 200 && res.data.token && res.data.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("svvNetId", res.data.user.svvNetId); // Use svvNetId from API response
        localStorage.setItem("user", JSON.stringify(res.data.user)); // Store full user object including role and branch

        console.log("Logged in via API. User:", res.data.user); // Debugging

        // Navigate to home or role-specific dashboard
        navigate("/home"); 
      } else {
        // Handle cases where API returns 200 but data is not as expected
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      // Handle network errors or server-side validation errors
      setError(err.response?.data?.message || "Login failed. Please try again later.");
    }
    */
    // --- END DATABASE INTEGRATION SPACE ---
  };

  return (
    <div className="login-page">
      {/* Navbar */}
      <div className="navbar">
        <img src={logo} alt="Somaiya Logo" className="navbar-logo" />
        <h1 className="navbar-title">Welcome to Student Development Cell</h1>
        <img src={logo1} alt="Somaiya Trust Logo" className="navbar-logo1" />
      </div>

      {/* Login Container */}
      <div className="login-container">
        {/* Validator Box */}
        <div className="validator-box">
          <h1 className="validator-title">
            <span className="highlight">Student</span> <br />
            <span className="highlight">Development Cell</span>
          </h1>
          <p className="description">
            The Student Development Policy at K. J. Somaiya College of Engineering reflects our
            commitment to fostering a dynamic and enriching academic environment for students across all levels of study.
          </p>
          <h2 className="validator-question">Validator ?</h2>

          <p className="validator-login-text">Login to go on Dashboard</p>
          <button className="google-login">
            <img src={googleIcon} alt="Google" className="icon" /> Login with Somaiya mail
          </button>
        </div>

        {/* Student Login Box */}
        <div className="student-login-box">
          <h2 className="form-title">Please enter your SVV Net ID & password to Login.</h2>
          <form className="login-form" onSubmit={handleLogin}>
            <label>SVV Net ID *</label>
            <input
              type="text"
              placeholder="Enter your SVV Net ID"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label>Password:</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="remember" className="w-4 h-4" />
              <label htmlFor="remember" className="text-sm">Remember me</label>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="login-button">Login</button>
          </form>
          <h1 className="or">OR</h1>
          <button className="google-login">
            <img src={googleIcon} alt="Google" className="icon" /> Login with Somaiya mail
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;