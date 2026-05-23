import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import api from '../../api/axios'
import './auth.css'
import logoAivest from '../../assets/logo-aivest.png'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      navigate('/dashboard')
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Login gagal')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-orb one"></div>
      <div className="auth-orb two"></div>

      <section className="auth-showcase">
        <div className="landing-brand">
          <img src={logoAivest} alt="AIVEST Logo" />
          <div>
            <h1>AIVEST</h1>
            <p>AI Financial Assistant</p>
          </div>
        </div>

        <h2>Welcome back to your financial control center.</h2>

        <p>
          Continue tracking your transactions, budgets, goals, and AI-powered
          financial insights in one dashboard.
        </p>
      </section>

      <section className="auth-form-side">
        <form className="auth-panel" onSubmit={handleLogin}>
          <div className="auth-panel-header">
            <h2>Log In</h2>
            <p className="auth-desc">Access your AIVEST financial portal.</p>
          </div>

          <label>Email Address</label>
          <div className="auth-input-group">
            <Mail size={20} />
            <input
              type="email"
              placeholder="name@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="label-row">
            <label>Password</label>
            <button type="button">Forgot Password</button>
          </div>

          <div className="auth-input-group">
            <Lock size={20} />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-primary-btn" type="submit">
            Log In <ArrowRight size={18} />
          </button>

          <div className="auth-divider">
            <span>Secure Access</span>
          </div>

          <p className="auth-switch">
            New to AIVEST? <Link to="/register">Create an account</Link>
          </p>

          <div className="auth-secure">
            <ShieldCheck size={18} />
            <span>Protected financial access</span>
          </div>
        </form>
      </section>
    </div>
  )
}