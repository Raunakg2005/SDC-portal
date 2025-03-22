import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const [svvNetId, setSvvNetId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); // Reset error state

        try {
            const res = await axios.post("http://localhost:5000/api/auth/login", { svvNetId, password });

            if (res.status === 200) {
                localStorage.setItem("token", res.data.token); // Save token
                navigate("/ApplicationPortal"); // Redirect after login
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login Failed");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <input type="text" placeholder="SVVNet ID" value={svvNetId} onChange={(e) => setSvvNetId(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default LoginPage;
