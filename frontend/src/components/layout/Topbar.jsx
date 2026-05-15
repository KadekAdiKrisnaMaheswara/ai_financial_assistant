import { Bell, MessageSquare, Search } from 'lucide-react'

function Topbar() {
  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search markets or assets..."
        />
      </div>

      <div className="topbar-right">
        <button className="top-icon-btn">
          <Bell size={22} />
        </button>

        <button className="top-icon-btn">
          <MessageSquare size={22} />
        </button>

        <div className="topbar-divider"></div>

        <div className="profile">
          <div>
            <h4>{user?.full_name || 'AIVEST User'}</h4>
            <p>Moderate Client</p>
          </div>

          <img
            src="https://i.pravatar.cc/100"
            alt="profile"
          />
        </div>
      </div>
    </header>
  )
}

export default Topbar