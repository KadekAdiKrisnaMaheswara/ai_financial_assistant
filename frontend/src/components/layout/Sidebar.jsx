import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ICONS } from '../ui/icons'
import logoAivest from '../../assets/logo-aivest.png'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const menus = [
    { title: 'Dashboard', icon: ICONS.dashboard, path: '/dashboard' },
    { title: 'Transactions', icon: ICONS.transaction, path: '/transactions' },
    { title: 'Budgets', icon: ICONS.budgets, path: '/budgets' },
    { title: 'Goals', icon: ICONS.goal, path: '/goals' },
    { title: 'Analytics', icon: ICONS.analytics, path: '/analytics' },
    { title: 'AI Assistant', icon: ICONS.ai, path: '/ai-assistant' },
  ]

  const SettingsIcon = ICONS.settings
  const LogoutIcon = ICONS.logout

const handleLogout = () => {
  const confirmLogout = window.confirm(
    'Are you sure you want to logout from AIVEST?'
  )

  if (!confirmLogout) return

  localStorage.removeItem('token')
  localStorage.removeItem('user')

  window.location.replace('/login')
}

return (
  <aside className="sidebar">
    <div className="sidebar-main">
      <div className="sidebar-brand">
        <img className="sidebar-logo" src={logoAivest} alt="AIVEST Logo" />

        <div>
          <h1>AIVEST</h1>
          <p>AI Financial Assistant</p>
        </div>
      </div>

      <nav className="menu-list">
        {menus.map((menu) => {
          const Icon = menu.icon

          return (
            <Link
              key={menu.path}
              to={menu.path}
              className={`menu-item ${
                location.pathname === menu.path ? 'active' : ''
              }`}
            >
              <Icon size={18} />
              <span>{menu.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>

    <div className="sidebar-bottom">
      <button
        className="bottom-menu-item"
        type="button"
        onClick={() => navigate('/profile')}
      >
        <SettingsIcon size={18} />
        <span>Settings</span>
      </button>

      <button
        className="bottom-menu-item logout"
        type="button"
        onClick={handleLogout}
      >
        <LogoutIcon size={18} />
        <span>Logout</span>
      </button>
    </div>
  </aside>
)
}

export default Sidebar