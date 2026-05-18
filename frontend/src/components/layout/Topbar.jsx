import { Bell, MessageSquare, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'

function Topbar() {
  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null

  const [budgets, setBudgets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [budgetRes, transactionRes] = await Promise.all([
          api.get('/budgets', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get('/transactions', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        setBudgets(budgetRes.data)
        setTransactions(transactionRes.data)
      } catch (error) {
        console.log(error)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token])

  const notifications = useMemo(() => {
    return budgets
      .map((budget) => {
        const spent = transactions
          .filter((transaction) => {
            const trxDate = new Date(transaction.transaction_date)
            const start = new Date(budget.start_date)
            const end = new Date(budget.end_date)

            return (
              transaction.type === 'expense' &&
              transaction.category_id === budget.category_id &&
              trxDate >= start &&
              trxDate <= end
            )
          })
          .reduce((total, item) => total + Number(item.amount), 0)

        const limit = Number(budget.limit_amount)
        const percentage = limit > 0 ? (spent / limit) * 100 : 0
        const categoryName = budget.category?.name || 'Uncategorized'

        if (percentage >= 100) {
          return {
            type: 'danger',
            title: `${categoryName} budget exceeded`,
            description: 'Budget limit exceeded',
          }
        }

        if (percentage >= 75) {
          return {
            type: 'warning',
            title: `${categoryName} budget almost full`,
            description: 'Budget usage is almost full',
          }
        }

        return null
      })
      .filter(Boolean)
  }, [budgets, transactions])

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
        <div className="notification-wrapper">
          <button
            className="top-icon-btn"
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={22} />
          </button>

          {notifications.length > 0 && (
            <span className="notification-badge">
              {notifications.length}
            </span>
          )}

          {showNotifications && (
            <div className="aivest-notif-dropdown">
              <div className="aivest-notif-header">
                <h4>Notifications</h4>

                <span>{notifications.length}</span>
              </div>

              {notifications.length === 0 ? (
                <p className="aivest-notif-empty">
                  No notifications
                </p>
              ) : (
                notifications.map((item, index) => (
                  <div
                    key={index}
                    className={`aivest-notif-card ${item.type}`}
                  >
                    <h5>{item.title}</h5>
                    <p>{item.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button className="top-icon-btn" type="button">
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