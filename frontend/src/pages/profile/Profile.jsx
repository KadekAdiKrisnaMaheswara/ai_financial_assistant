import { Bell, Camera, Lock, ShieldCheck, Laptop, Smartphone } from 'lucide-react'
import MainLayout from '../../components/layout/MainLayout'
import './profile.css'

export default function Profile() {
  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null

  return (
    <MainLayout>
      <div className="profile-page">
        <div className="profile-header">
          <div>
            <h1>Account Settings</h1>
            <p>Manage your AIVEST profile and security preferences.</p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-left">
            <div className="profile-card personal-card">
              <div className="card-title-row">
                <h2>Personal Information</h2>
                <button>Edit Profile</button>
              </div>

              <div className="profile-info">
                <div className="avatar-wrapper">
                  <img src="https://i.pravatar.cc/160" alt="avatar" />
                  <button>
                    <Camera size={18} />
                  </button>
                </div>

                <div>
                  <h2>{user?.full_name || 'AIVEST User'}</h2>
                  <p>Financial Account Member</p>

                  <div className="profile-badges">
                    <span>VERIFIED</span>
                    <span>AIVEST ACCOUNT</span>
                  </div>
                </div>
              </div>

              <div className="profile-details">
                <div>
                  <span>Full Name</span>
                  <strong>{user?.full_name || '-'}</strong>
                </div>

                <div>
                  <span>Email Address</span>
                  <strong>{user?.email || '-'}</strong>
                </div>

                <div>
                  <span>Phone Number</span>
                  <strong>-</strong>
                </div>

                <div>
                  <span>Currency</span>
                  <strong>IDR</strong>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <h2>Notification Preferences</h2>

              <div className="notification-item">
                <div>
                  <h4>Transaction Alerts</h4>
                  <p>Instant alerts when income or expenses are recorded.</p>
                </div>

                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <h4>Budget Warnings</h4>
                  <p>Notify when spending exceeds budget limits.</p>
                </div>

                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <h4>Security Alerts</h4>
                  <p>Critical notifications regarding account access and logins.</p>
                </div>

                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span></span>
                </label>
              </div>
            </div>
          </div>

          <div className="profile-right">
            <div className="profile-card security-card">
              <h2>Security</h2>

              <div className="security-item">
                <div className="security-icon blue">
                  <Lock size={20} />
                </div>

                <div>
                  <span>Last Password Change</span>
                  <strong>Recently updated</strong>
                </div>
              </div>

              <div className="security-item">
                <div className="security-icon orange">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <span>Two-Factor Auth</span>
                  <strong>Not Active</strong>
                </div>
              </div>

              <button className="security-btn">Change Password</button>
              <button className="security-btn">Update 2FA Method</button>
            </div>

            <div className="profile-card sessions-card">
              <h2>Active Sessions</h2>

              <div className="session-item active">
                <Laptop size={22} />
                <div>
                  <h4>Windows Device</h4>
                  <p>Current Session</p>
                </div>
              </div>

              <div className="session-item">
                <Smartphone size={22} />
                <div>
                  <h4>Mobile Device</h4>
                  <p>Last active recently</p>
                </div>
              </div>

              <button className="logout-session">
                Log out of all other sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}