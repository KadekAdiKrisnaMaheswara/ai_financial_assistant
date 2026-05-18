import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Target,
  User,
  Wallet,
} from 'lucide-react'
import api from '../../api/axios'
import './auth.css'

export default function Register() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert('Password dan Confirm Password tidak sama')
      return
    }

    if (!agree) {
      alert('Kamu harus menyetujui Terms of Service dan Privacy Policy')
      return
    }

    try {
      await api.post('/auth/register', {
        full_name: fullName,
        email,
        password,
      })

      alert('Register berhasil')
      navigate('/login')
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Register gagal')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-orb one"></div>
      <div className="auth-orb two"></div>

      <section className="auth-showcase">
        <div className="auth-brand">
          <div className="auth-logo">A</div>
          <div>
            <h1>AIVEST</h1>
            <p>AI Financial Assistant</p>
          </div>
        </div>

        <h2>Start building smarter financial habits with AIVEST.</h2>

        <p>
          Create your account to track transactions, manage budgets, monitor
          goals, and unlock AI-based financial recommendations.
        </p>

        <div className="auth-feature-list">
          <div className="auth-feature">
            <Wallet size={22} />
            <div>
              <h4>Budget Control</h4>
              <p>Set limits and monitor overspending.</p>
            </div>
          </div>

          <div className="auth-feature">
            <Target size={22} />
            <div>
              <h4>Goal Tracking</h4>
              <p>Track your savings target progress.</p>
            </div>
          </div>

          <div className="auth-feature">
            <Bot size={22} />
            <div>
              <h4>AI Recommendation</h4>
              <p>Receive smart financial guidance.</p>
            </div>
          </div>

          <div className="auth-feature">
            <ChartNoAxesCombined size={22} />
            <div>
              <h4>Analytics</h4>
              <p>Understand income and expenses better.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <form className="auth-panel register-panel" onSubmit={handleRegister}>
          <div className="auth-panel-header">
            <h2>Create Account</h2>
            <p className="auth-desc">Join AIVEST for AI financial insights.</p>
          </div>

          <label>Full Name</label>
          <div className="auth-input-group">
            <User size={20} />
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
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

          <label>Password</label>
          <div className="auth-input-group">
            <Lock size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              className="auth-eye-btn"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label>Confirm Password</label>
          <div className="auth-input-group">
            <Lock size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree to the <b>Terms of Service</b> and <b>Privacy Policy</b>.
            </span>
          </label>

          <button className="auth-primary-btn" type="submit">
            Sign Up <ArrowRight size={18} />
          </button>

          <div className="auth-divider">
            <span>Secure Registration</span>
          </div>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log In</Link>
          </p>

          <div className="auth-secure">
            <ShieldCheck size={18} />
            <span>Encrypted financial account access</span>
          </div>
        </form>
      </section>

      <footer className="auth-footer">
        <span>© 2026 AIVEST. All rights reserved.</span>

        <div>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Security</span>
        </div>
      </footer>
    </div>
  )
}