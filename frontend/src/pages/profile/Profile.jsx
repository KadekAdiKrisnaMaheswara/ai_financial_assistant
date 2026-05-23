import { useRef, useState } from 'react'
import { Camera, Lock, ShieldCheck, Laptop, Smartphone } from 'lucide-react'
import MainLayout from '../../components/layout/MainLayout'
import '../../styles/components.css'
import './profile.css'

export default function Profile() {
  const fileInputRef = useRef(null)

  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null

  const [isEditing, setIsEditing] = useState(false)

  const [avatar, setAvatar] = useState(
    localStorage.getItem('profile_picture') || 'https://i.pravatar.cc/160'
  )

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: localStorage.getItem('phone_number') || '',
    currency: localStorage.getItem('currency') || 'IDR',
  })

  const handleChangePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onloadend = () => {
      setAvatar(reader.result)
    }

    reader.readAsDataURL(file)
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

const handleEditProfile = () => {
  if (!isEditing) {
    setIsEditing(true)
    return
  }

  const updatedUser = {
    ...(user || {}),
    full_name: formData.full_name,
    email: formData.email,
  }

  localStorage.setItem('user', JSON.stringify(updatedUser))
  localStorage.setItem('profile_picture', avatar)
  localStorage.setItem('phone_number', formData.phone)
  localStorage.setItem('currency', formData.currency)

  window.dispatchEvent(new Event('profilePictureChanged'))
  window.dispatchEvent(new Event('profileUpdated'))

  setIsEditing(false)

  alert('Profile updated successfully')
}

  return (
    <MainLayout>
      <div className="app-page profile-page">
        <div className="page-header profile-header">
          <div>
            <h1 className="page-title">Account Settings</h1>
            <p className="page-subtitle">
              Manage your AIVEST profile and security preferences.
            </p>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-left">
            <div className="app-card app-card-p profile-card personal-card">
              <div className="card-title-row">
                <h2>Personal Information</h2>

                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={handleEditProfile}
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
              </div>

              <div className="profile-info">
                <div className="avatar-wrapper">
                  <img src={avatar} alt="Profile" />

                  {isEditing && (
                    <>
                      <button
                        type="button"
                        className="avatar-upload-btn"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <Camera size={18} />
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleChangePhoto}
                      />
                    </>
                  )}
                </div>

                <div className="profile-text">
                  {isEditing ? (
                    <input
                      className="profile-name-input"
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <h2>{formData.full_name || 'AIVEST User'}</h2>
                  )}

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
                  {isEditing ? (
                    <input
                      className="profile-input"
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <strong>{formData.full_name || '-'}</strong>
                  )}
                </div>

                <div>
                  <span>Email Address</span>
                  {isEditing ? (
                    <input
                      className="profile-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <strong>{formData.email || '-'}</strong>
                  )}
                </div>

                <div>
                  <span>Phone Number</span>
                  {isEditing ? (
                    <input
                      className="profile-input"
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <strong>{formData.phone || '-'}</strong>
                  )}
                </div>

                <div>
                  <span>Currency</span>
                  {isEditing ? (
                    <select
                      className="profile-input"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                    >
                      <option value="IDR">IDR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  ) : (
                    <strong>{formData.currency}</strong>
                  )}
                </div>
              </div>
            </div>

            <div className="app-card app-card-p profile-card">
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
            <div className="app-card app-card-p profile-card security-card">
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

              <div className="security-actions">
                <button className="btn btn-secondary btn-full security-btn">
                  Change Password
                </button>
                <button className="btn btn-secondary btn-full security-btn">
                  Update 2FA Method
                </button>
              </div>
            </div>

            <div className="app-card app-card-p profile-card sessions-card">
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

              <button className="btn btn-danger btn-full logout-session">
                Log out of all other sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}