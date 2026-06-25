import { useCallback, useEffect, useMemo, useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../api/axios'
import '../../styles/components.css'
import './budgets.css'

const calculateEndDate = (startDate, period) => {
  const date = new Date(startDate)

  if (period === 'weekly') date.setDate(date.getDate() + 7)
  if (period === 'monthly') date.setMonth(date.getMonth() + 1)
  if (period === 'yearly') date.setFullYear(date.getFullYear() + 1)

  return date.toISOString().split('T')[0]
}

export default function Budgets() {
  const today = new Date().toISOString().split('T')[0]

  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    category_id: '',
    limit_amount: '',
    period: 'monthly',
    start_date: today,
    end_date: calculateEndDate(today, 'monthly'),
  })

  const token = localStorage.getItem('token')

  const authHeader = useMemo(() => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }, [token])

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await api.get('/budgets', authHeader)
      setBudgets(res.data)
    } catch (error) {
      console.log(error)
    }
  }, [authHeader])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories', authHeader)
      setCategories(res.data.filter((category) => category.type === 'expense'))
    } catch (error) {
      console.log(error)
    }
  }, [authHeader])

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get('/transactions', authHeader)
      setTransactions(res.data)
    } catch (error) {
      console.log(error)
    }
  }, [authHeader])

  useEffect(() => {
    if (token) {
      fetchBudgets()
      fetchCategories()
      fetchTransactions()
    }
  }, [fetchBudgets, fetchCategories, fetchTransactions, token])

  const formatRupiah = (value) => {
    const numberString = String(value).replace(/[^\d]/g, '')

    if (!numberString) return ''

    return new Intl.NumberFormat('id-ID').format(Number(numberString))
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'limit_amount') {
      const rawValue = value.replace(/[^\d]/g, '')

      setForm((prev) => ({
        ...prev,
        limit_amount: rawValue,
      }))

      return
    }

    if (name === 'start_date') {
      setForm((prev) => ({
        ...prev,
        start_date: value,
        end_date: calculateEndDate(value, prev.period),
      }))

      return
    }

    if (name === 'period') {
      setForm((prev) => ({
        ...prev,
        period: value,
        end_date: calculateEndDate(prev.start_date, value),
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateSpent = (budget) => {
    return transactions
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
  }

  const totalBudget = useMemo(() => {
    return budgets.reduce(
      (total, budget) => total + Number(budget.limit_amount),
      0
    )
  }, [budgets])

  const totalSpent = useMemo(() => {
    return budgets.reduce(
      (total, budget) => total + calculateSpent(budget),
      0
    )
  }, [budgets, transactions])

  const resetForm = () => {
    setForm({
      category_id: '',
      limit_amount: '',
      period: 'monthly',
      start_date: today,
      end_date: calculateEndDate(today, 'monthly'),
    })

    setEditingId(null)
    setShowForm(false)
  }

  const handleOpenCreateForm = () => {
    if (showForm && !editingId) {
      setShowForm(false)
      return
    }

    setEditingId(null)
    setForm({
      category_id: '',
      limit_amount: '',
      period: 'monthly',
      start_date: today,
      end_date: calculateEndDate(today, 'monthly'),
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      category_id: form.category_id,
      limit_amount: Number(String(form.limit_amount).replace(/[^\d]/g, '')),
      period: form.period,
      start_date: form.start_date,
      end_date: form.end_date,
    }

    try {
      if (editingId) {
        await api.put(`/budgets/${editingId}`, payload, authHeader)
        alert('Budget berhasil diupdate')
      } else {
        await api.post('/budgets', payload, authHeader)
        alert('Budget berhasil ditambahkan')
      }

      resetForm()
      fetchBudgets()
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal menyimpan budget')
    }
  }

  const handleEdit = (budget) => {
    setEditingId(budget.id)
    setShowForm(true)

    setForm({
      category_id: budget.category_id,
      limit_amount: String(budget.limit_amount),
      period: budget.period,
      start_date: new Date(budget.start_date).toISOString().split('T')[0],
      end_date: new Date(budget.end_date).toISOString().split('T')[0],
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this budget?'
    )

    if (!confirmDelete) return

    try {
      await api.delete(`/budgets/${id}`, authHeader)
      alert('Budget berhasil dihapus')
      fetchBudgets()
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal hapus budget')
    }
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  return (
    <MainLayout>
      <div className="app-page budgets-page">
        <div className="page-header budgets-header">
          <div>
            <h1 className="page-title">Budget Planner</h1>
            <p className="page-subtitle">
              Set limits, track expenses, and control category spending.
            </p>
          </div>

          <div className="budget-header-actions">
            <div className="app-card budget-summary">
              <span>Total Budget</span>
              <strong>Rp {totalBudget.toLocaleString('id-ID')}</strong>
            </div>

            <button
              className="btn btn-primary budget-create-btn"
              type="button"
              onClick={handleOpenCreateForm}
            >
              {showForm && !editingId ? 'Close Form' : '+ Create Budget'}
            </button>
          </div>
        </div>

        <div className="budget-overview">
          <div className="app-card metric-card budget-metric-card">
            <span>Total Spent</span>
            <h2>Rp {totalSpent.toLocaleString('id-ID')}</h2>
            <p>Across active budget periods</p>
          </div>

          <div className="app-card metric-card budget-metric-card">
            <span>Remaining</span>
            <h2>Rp {(totalBudget - totalSpent).toLocaleString('id-ID')}</h2>
            <p>Available budget balance</p>
          </div>

          <div className="app-card metric-card budget-metric-card">
            <span>Active Budgets</span>
            <h2>{budgets.length}</h2>
            <p>Budget rules configured</p>
          </div>
        </div>

        {showForm && (
          <form
            className="app-card app-card-p budget-form-card"
            onSubmit={handleSubmit}
          >
            <div className="card-header budget-form-header">
              <h2>{editingId ? 'Edit Budget' : 'Create Budget'}</h2>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm cancel-budget-btn"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="form-grid budget-form-grid">
              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select expense category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Limit Amount</label>
                <input
                  className="form-control"
                  type="text"
                  name="limit_amount"
                  placeholder="Example: Rp 100.000"
                  value={
                    form.limit_amount
                      ? `Rp ${formatRupiah(form.limit_amount)}`
                      : ''
                  }
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Period</label>
                <select
                  className="form-control"
                  name="period"
                  value={form.period}
                  onChange={handleChange}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="form-label">Start Date</label>
                <input
                  className="form-control"
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">End Date</label>
                <input
                  className="form-control"
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-full budget-submit-btn"
              type="submit"
            >
              {editingId ? 'Update Budget' : 'Save Budget'}
            </button>
          </form>
        )}

        <div className="budget-table-card app-card">
          <div className="budget-table-header">
            <h2>Budget List</h2>
            <span>{budgets.length} budgets</span>
          </div>

          <div className="budget-list-wrapper">
            {budgets.length === 0 ? (
              <div className="empty-budget">No budgets yet.</div>
            ) : (
              budgets.map((budget) => {
                const spent = calculateSpent(budget)
                const limit = Number(budget.limit_amount)
                const rawPercentage = limit > 0 ? (spent / limit) * 100 : 0
                const percentage = Math.min(rawPercentage, 100)
                const isOverBudget = spent > limit

                return (
                  <div className="budget-list-row" key={budget.id}>
                    <div className="budget-main-info">
                      <span className="budget-category-badge">
                        {budget.category?.name || 'Uncategorized'}
                      </span>

                      <div>
                        <h4>{budget.period}</h4>
                        <p>
                          {new Date(budget.start_date).toLocaleDateString(
                            'id-ID'
                          )}{' '}
                          -{' '}
                          {new Date(budget.end_date).toLocaleDateString(
                            'id-ID'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="budget-money-info">
                      <div>
                        <span>Limit</span>
                        <strong>Rp {limit.toLocaleString('id-ID')}</strong>
                      </div>

                      <div>
                        <span>Spent</span>
                        <strong>Rp {spent.toLocaleString('id-ID')}</strong>
                      </div>
                    </div>

                    <div className="budget-progress-area">
                      <div className="budget-progress-top">
                        <span>Progress</span>
                        <strong
                          className={
                            isOverBudget
                              ? 'danger'
                              : percentage >= 75
                                ? 'warning'
                                : 'safe'
                          }
                        >
                          {isOverBudget
                            ? `Over Rp ${(spent - limit).toLocaleString(
                                'id-ID'
                              )}`
                            : `${Math.round(percentage)}%`}
                        </strong>
                      </div>

                      <div className="budget-progress-track">
                        <div
                          className={`budget-progress-fill ${
                            percentage >= 100
                              ? 'danger'
                              : percentage >= 75
                                ? 'warning'
                                : ''
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="budget-row-actions">
                      <span
                        className={
                          isOverBudget
                            ? 'budget-status danger'
                            : percentage >= 75
                              ? 'budget-status warning'
                              : 'budget-status safe'
                        }
                      >
                        {isOverBudget
                          ? 'Over'
                          : percentage >= 75
                            ? 'Warning'
                            : 'Safe'}
                      </span>

                      <button
                        className="btn btn-secondary btn-sm budget-edit-btn"
                        onClick={() => handleEdit(budget)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger btn-sm budget-delete-btn"
                        onClick={() => handleDelete(budget.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}