import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  PieChart,
  ShieldCheck,
  Target,
  Wallet,
} from 'lucide-react'
import './landingPage.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <div className="landing-orb orb-one"></div>
      <div className="landing-orb orb-two"></div>

      <header className="landing-header">
        <div className="landing-brand">
          <div className="brand-logo">A</div>
          <div>
            <h1>AIVEST</h1>
            <p>AI Financial Assistant</p>
          </div>
        </div>

        <div className="landing-buttons">
          <button onClick={() => navigate('/login')}>Login</button>
          <button className="primary" onClick={() => navigate('/register')}>
            Register
          </button>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-left">
          <span className="badge">AI Powered Finance Platform</span>

          <h2>
            Take control of your money with intelligent financial tracking.
          </h2>

          <p>
            Track transactions, control budgets, monitor goals, and get AI-powered
            insights to improve your financial decisions.
          </p>

          <div className="hero-actions">
            <button className="primary" onClick={() => navigate('/register')}>
              Get Started <ArrowRight size={18} />
            </button>

            <button onClick={() => navigate('/login')}>Sign In</button>
          </div>

          <div className="hero-tags">
            <span>Budget Alert</span>
            <span>Goal Tracking</span>
            <span>AI Insight</span>
          </div>
        </div>

        <div className="hero-right">
          <div className="dashboard-card floating">
            <div className="dashboard-card-top">
              <div>
                <p>Total Balance</p>
                <h3>Rp 51.252.000</h3>
              </div>
              <span>Healthy</span>
            </div>

            <div className="fake-chart">
              <div className="bar bar-1"></div>
              <div className="bar bar-2"></div>
              <div className="bar bar-3"></div>
              <div className="bar bar-4"></div>
              <div className="bar bar-5"></div>
            </div>

            <div className="mini-grid">
              <div>
                <p>Income</p>
                <h4>Rp 102.010.000</h4>
              </div>

              <div>
                <p>Expenses</p>
                <h4>Rp 50.758.000</h4>
              </div>
            </div>

            <div className="ai-box">
              <Bot size={20} />
              <div>
                <h4>AI Recommendation</h4>
                <p>Your cashflow is healthy. Allocate more into financial goals.</p>
              </div>
            </div>
          </div>

          <div className="floating-card card-budget">
            <PieChart size={18} />
            <div>
              <h4>Budget Control</h4>
              <p>2 budgets need review</p>
            </div>
          </div>

          <div className="floating-card card-goal">
            <Target size={18} />
            <div>
              <h4>Goal Progress</h4>
              <p>Smartwatch 45%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading">
          <span>Features</span>
          <h2>Built for personal finance monitoring.</h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <Wallet />
            <h3>Transactions</h3>
            <p>Track income and expenses by category.</p>
          </div>

          <div className="feature-card">
            <PieChart />
            <h3>Budgets</h3>
            <p>Set spending limits and detect overspending.</p>
          </div>

          <div className="feature-card">
            <Target />
            <h3>Goals</h3>
            <p>Monitor savings progress toward your targets.</p>
          </div>

          <div className="feature-card">
            <ChartNoAxesCombined />
            <h3>Analytics</h3>
            <p>Visualize cashflow and financial activity.</p>
          </div>

          <div className="feature-card">
            <Bot />
            <h3>AI Insights</h3>
            <p>Get recommendations based on your financial data.</p>
          </div>

          <div className="feature-card">
            <ShieldCheck />
            <h3>Secure Access</h3>
            <p>Your financial records stay protected.</p>
          </div>
        </div>
      </section>
    </div>
  )
}