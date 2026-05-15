import { useCallback, useEffect, useMemo, useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../api/axios'
import './transactions.css'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [activePanel, setActivePanel] = useState(null)

  const [form, setForm] = useState({
    description: '',
    type: 'expense',
    amount: '',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
  })

  const token = localStorage.getItem('token')

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/transactions', authHeader)
      setTransactions(response.data)
    } catch (error) {
      console.log(error)
    }
  }, [token])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories', authHeader)
      setCategories(response.data)
    } catch (error) {
      console.log(error)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchTransactions()
      fetchCategories()
    }
  }, [fetchTransactions, fetchCategories, token])

  const filteredCategories = categories.filter(
    (category) => category.type === form.type
  )

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return transactions

    return transactions.filter(
      (transaction) => transaction.category_id === activeFilter
    )
  }, [transactions, activeFilter])

  const monthlyOutflow = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'expense')
      .reduce((total, item) => total + Number(item.amount), 0)
  }, [transactions])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleTypeChange = (e) => {
    setForm({
      ...form,
      type: e.target.value,
      category_id: '',
    })
  }

  const handleCategoryChange = (e) => {
    setCategoryForm({
      ...categoryForm,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmitTransaction = async (e) => {
    e.preventDefault()

    try {
      await api.post(
        '/transactions',
        {
          category_id: form.category_id,
          amount: Number(form.amount),
          type: form.type,
          description: form.description,
          transaction_date: form.transaction_date,
          notes: form.notes,
        },
        authHeader
      )

      alert('Transaksi berhasil ditambahkan')

      setForm({
        description: '',
        type: 'expense',
        amount: '',
        category_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: '',
      })

      setActivePanel(null)
      fetchTransactions()
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal menambahkan transaksi')
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()

    try {
      await api.post('/categories', categoryForm, authHeader)

      alert('Category berhasil ditambahkan')

      setCategoryForm({
        name: '',
        type: 'expense',
      })

      setActivePanel(null)
      fetchCategories()
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal membuat category')
    }
  }

  return (
    <MainLayout>
      <div className="transactions-page">
        <div className="transactions-top">
          <div>
            <h1>Transactions</h1>
            <p>Review and manage your financial asset movements.</p>
          </div>

          <div className="transactions-actions">
            <button
              className="secondary-action"
              onClick={() =>
                setActivePanel(activePanel === 'category' ? null : 'category')
              }
            >
              + Create Category
            </button>

            <button
              className="primary-action"
              onClick={() =>
                setActivePanel(activePanel === 'transaction' ? null : 'transaction')
              }
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {activePanel === 'transaction' && (
          <form className="floating-form-card" onSubmit={handleSubmitTransaction}>
            <h2>Add Transaction</h2>

            <div className="form-grid">
              <div>
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  placeholder="Example: Coffee, Salary"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleTypeChange}>
                  <option value="income">Income / Pemasukan</option>
                  <option value="expense">Expense / Pengeluaran</option>
                </select>
              </div>

              <div>
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="Example: 100000"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Category</label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Date</label>
                <input
                  type="date"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Notes</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="submit-action">
              Save Transaction
            </button>
          </form>
        )}

        {activePanel === 'category' && (
          <form className="floating-form-card" onSubmit={handleCreateCategory}>
            <h2>Create Category</h2>

            <div className="form-grid">
              <div>
                <label>Category Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Example: Coffee"
                  value={categoryForm.name}
                  onChange={handleCategoryChange}
                  required
                />
              </div>

              <div>
                <label>Type</label>
                <select
                  name="type"
                  value={categoryForm.type}
                  onChange={handleCategoryChange}
                >
                  <option value="income">Income / Pemasukan</option>
                  <option value="expense">Expense / Pengeluaran</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-action">
              Save Category
            </button>
          </form>
        )}

        <div className="transactions-overview">
          <div className="filter-card">
            <span className="filter-label">FILTERS:</span>

            <button
              className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Activity
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                className={`filter-pill ${
                  activeFilter === category.id ? 'active' : ''
                }`}
                onClick={() => setActiveFilter(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="summary-card">
            <span>Monthly Outflow</span>
            <h2>Rp {monthlyOutflow.toLocaleString('id-ID')}</h2>
            <p>↗ 4.2% vs last month</p>
          </div>
        </div>

        <div className="transactions-table-card">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="transaction-name">
                        <div className="transaction-icon">
                          {item.type === 'income' ? '↗' : '↘'}
                        </div>

                        <div>
                          <strong>{item.description || 'No description'}</strong>
                          <span>Transaction ID: #{item.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="category-badge">
                        {item.category?.name || 'Uncategorized'}
                      </span>
                    </td>

                    <td>
                      {item.transaction_date
                        ? new Date(item.transaction_date).toLocaleDateString(
                            'id-ID',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )
                        : '-'}
                    </td>

                    <td
                      className={
                        item.type === 'income'
                          ? 'amount-income'
                          : 'amount-expense'
                      }
                    >
                      {item.type === 'income' ? '+' : '-'}Rp{' '}
                      {Number(item.amount).toLocaleString('id-ID')}
                    </td>

                    <td>
                      <span className="status-dot"></span>
                      Completed
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="table-footer">
            <span>
              Showing {filteredTransactions.length} of {transactions.length}{' '}
              transactions
            </span>

            <div className="pagination">
              <button>‹</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <button>›</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}