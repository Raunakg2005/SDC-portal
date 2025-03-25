import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ExpenseUpload.css";

const ExpenseUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const referringPage = location.state?.from || "/expenses"; // Default redirect

  const [expenseData, setExpenseData] = useState({
    expenseDetails: "",
    expensePrice: "",
    expenseName: "",
    category: "Travel",
    expenseProof: null,
  });

  useEffect(() => {
    sessionStorage.setItem("expenseData", JSON.stringify(expenseData));
  }, [expenseData]);

  const handleInputChange = (name, value) => {
    setExpenseData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file && file.type === "application/pdf" && file.size <= 5 * 1024 * 1024) {
      setExpenseData((prevState) => ({
        ...prevState,
        expenseProof: file,
      }));
    } else {
      alert("Only PDF files up to 5MB are allowed.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!expenseData.expenseProof) {
      alert("Please upload a valid PDF proof.");
      return;
    }

    const formData = new FormData();
    formData.append("expenseDetails", expenseData.expenseDetails);
    formData.append("expensePrice", expenseData.expensePrice);
    formData.append("expenseName", expenseData.expenseName);
    formData.append("category", expenseData.category);
    formData.append("expenseProof", expenseData.expenseProof);

    try {
      await axios.post("http://localhost:5000/api/expense/upload-expense", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Expense uploaded successfully!");

      setExpenseData({
        expenseDetails: "",
        expensePrice: "",
        expenseName: "",
        category: "Travel",
        expenseProof: null,
      });

      navigate(referringPage);
    } catch (error) {
      console.error("Error uploading expense:", error.response?.data || error);
      alert(`Failed to upload expense: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="expense-upload-container">
      <h1>Expense Upload</h1>
      <form className="expense-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Expense Details:</label>
          <input
            type="text"
            value={expenseData.expenseDetails}
            onChange={(e) => handleInputChange("expenseDetails", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Expense Price (INR):</label>
          <input
            type="number"
            value={expenseData.expensePrice}
            onChange={(e) => handleInputChange("expensePrice", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Expense Name:</label>
          <input
            type="text"
            value={expenseData.expenseName}
            onChange={(e) => handleInputChange("expenseName", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select value={expenseData.category} onChange={(e) => handleInputChange("category", e.target.value)}>
            <option value="Travel">Travel</option>
            <option value="Lodging">Lodging</option>
            <option value="Boarding">Boarding</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
        </div>

        <div className="form-group">
          <label>Expense Proof (PDF, Max 5MB):</label>
          <input type="file" accept="application/pdf" onChange={handleFileChange} required />
        </div>

        <button type="submit" className="upload-btn">Upload & Return</button>
      </form>
    </div>
  );
};

export default ExpenseUpload;
