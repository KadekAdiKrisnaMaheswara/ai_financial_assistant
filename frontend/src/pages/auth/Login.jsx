import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "./auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert("Login gagal");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleLogin}>
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Login to your AIVEST account</p>

        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-button" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}