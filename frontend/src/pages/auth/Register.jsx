import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "./auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
      });

      alert("Register berhasil");
      navigate("/login");
    } catch (error) {
      console.log(error);
      alert("Register gagal");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleRegister}>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Start managing your finance</p>

        <input
          className="auth-input"
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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
          Register
        </button>
      </form>
    </div>
  );
}