import { useNavigate } from 'react-router-dom'
import './landingPage.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">

      <header className="landing-header">
        <div>
          <h1>AIVEST</h1>
          <p>Institutional Grade Financial Assistant</p>
        </div>

        <div className="landing-buttons">
          <button onClick={() => navigate('/login')}>
            Login
          </button>

          <button
            className="primary"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>
      </header>

      <section className="hero-section">

        <div className="hero-left">
          <span className="badge">
            AI Powered Investment Platform
          </span>

          <h2>
            Smarter Financial Decisions with AI Intelligence
          </h2>

          <p>
            Monitor portfolios, analyze market movements,
            and receive AI-powered investment insights
            in one institutional-grade platform.
          </p>

          <div className="hero-actions">
            <button
              className="primary"
              onClick={() => navigate('/register')}
            >
              Get Started
            </button>

            <button onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-stat">
            <span>Total Assets</span>
            <h3>$1,284,500</h3>
          </div>

          <div className="hero-chart"></div>
        </div>

      </section>

    </div>
  )
}