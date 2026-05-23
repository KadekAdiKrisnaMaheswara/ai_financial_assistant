import { useCallback, useEffect, useMemo, useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../api/axios'
import '../../styles/components.css'
import './Transactions.css'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [activePanel, setActivePanel] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [goals, setGoals] = useState([])
  const [receiptFile, setReceiptFile] = useState(null)
  const [isScanningReceipt, setIsScanningReceipt] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    period: 'all',
  })

  const defaultForm = {
    description: '',
    type: 'expense',
    amount: '',
    goal_id: '',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
  }

  const [form, setForm] = useState(defaultForm)

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

  const fetchGoals = useCallback(async () => {
    try {
      const response = await api.get('/goals', authHeader)
      setGoals(response.data)
    } catch (error) {
      console.log(error)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchTransactions()
      fetchCategories()
      fetchGoals()
    }
  }, [fetchTransactions, fetchCategories, fetchGoals, token])

  const filteredCategories = categories.filter(
    (category) => category.type === form.type
  )

  const filteredTransactions = useMemo(() => {
    const today = new Date()

    return transactions.filter((transaction) => {
      const transactionDate = transaction.transaction_date
        ? new Date(transaction.transaction_date)
        : null

      const matchesSearch =
        !filters.search ||
        transaction.description
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(filters.search.toLowerCase())

      const matchesType =
        filters.type === 'all' || transaction.type === filters.type

      const matchesCategory =
        filters.category === 'all' ||
        transaction.category_id === filters.category

      let matchesPeriod = true

      if (transactionDate && filters.period !== 'all') {
        const startOfToday = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        )

        if (filters.period === 'today') {
          matchesPeriod = transactionDate >= startOfToday
        }

        if (filters.period === 'week') {
          const startOfWeek = new Date(startOfToday)
          startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
          matchesPeriod = transactionDate >= startOfWeek
        }

        if (filters.period === 'month') {
          const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          )
          matchesPeriod = transactionDate >= startOfMonth
        }

        if (filters.period === '30days') {
          const last30Days = new Date(startOfToday)
          last30Days.setDate(startOfToday.getDate() - 30)
          matchesPeriod = transactionDate >= last30Days
        }
      }

      return matchesSearch && matchesType && matchesCategory && matchesPeriod
    })
  }, [transactions, filters])

  const monthlyOutflow = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'expense')
      .reduce((total, item) => total + Number(item.amount), 0)
  }, [transactions])

  const formatRupiah = (value) => {
    const numberString = String(value).replace(/[^\d]/g, '')

    if (!numberString) return ''

    return new Intl.NumberFormat('id-ID').format(Number(numberString))
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target

    setFilters({
      ...filters,
      [name]: value,
    })
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      period: 'all',
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'amount') {
      const rawValue = value.replace(/[^\d]/g, '')

      setForm({
        ...form,
        amount: rawValue,
      })

      return
    }

    if (name === 'goal_id') {
      const savingsCategory = categories.find(
        (category) =>
          category.name.toLowerCase() === 'savings' &&
          category.type === 'expense'
      )

      if (value && !savingsCategory) {
        alert(
          'Category Savings belum tersedia. Jalankan seed atau buat category Savings terlebih dahulu.'
        )
        return
      }

      setForm({
        ...form,
        goal_id: value,
        type: value ? 'expense' : form.type,
        category_id: value && savingsCategory ? savingsCategory.id : '',
      })

      return
    }

    setForm({
      ...form,
      [name]: value,
    })
  }

  const handleTypeChange = (e) => {
    if (form.goal_id) return

    setForm({
      ...form,
      type: e.target.value,
      category_id: '',
    })
  }

  const handleScanReceipt = async () => {
    if (!receiptFile) {
      alert('Pilih file struk terlebih dahulu')
      return
    }

    const formData = new FormData()
    formData.append('receipt', receiptFile)

    try {
      setIsScanningReceipt(true)

      const response = await api.post('/receipts/scan', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      const parsed = response.data.data.parsed

      setForm({
        ...form,
        description: parsed.description || form.description,
        amount: parsed.amount ? String(parsed.amount) : form.amount,
        type: parsed.type || 'expense',
        transaction_date: parsed.transaction_date
          ? new Date(parsed.transaction_date).toISOString().split('T')[0]
          : form.transaction_date,
        notes: parsed.notes || form.notes,
        goal_id: '',
        category_id: '',
      })

      alert(
        'Struk berhasil discan. Silakan pilih kategori lalu simpan transaksi.'
      )
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal scan struk')
    } finally {
      setIsScanningReceipt(false)
    }
  }

  const handleCategoryChange = (e) => {
    setCategoryForm({
      ...categoryForm,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmitTransaction = async (e) => {
    e.preventDefault()

    const payload = {
      category_id: form.category_id,
      amount: Number(form.amount),
      type: form.type,
      description: form.description,
      goal_id: form.goal_id || null,
      transaction_date: form.transaction_date,
      notes: form.notes,
    }

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload, authHeader)
        alert('Transaksi berhasil diupdate')
      } else {
        await api.post('/transactions', payload, authHeader)
        alert('Transaksi berhasil ditambahkan')
      }

      setForm(defaultForm)
      setReceiptFile(null)
      setEditingId(null)
      setActivePanel(null)
      fetchTransactions()
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal menyimpan transaksi')
    }
  }

  const handleEditTransaction = (item) => {
    setEditingId(item.id)
    setActivePanel('transaction')

    setForm({
      description: item.description || '',
      type: item.type,
      amount: String(item.amount),
      goal_id: item.goal_id || '',
      category_id: item.category_id,
      transaction_date: item.transaction_date
        ? new Date(item.transaction_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes: item.notes || '',
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setActivePanel(null)
    setForm(defaultForm)
  }

  const handleDeleteTransaction = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this transaction?'
    )

    if (!confirmDelete) return

    try {
      await api.delete(`/transactions/${id}`, authHeader)
      alert('Transaksi berhasil dihapus')
      fetchTransactions()
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal menghapus transaksi')
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
      <div className="app-page transactions-page">
        <div className="page-header transactions-top">
          <div>
            <h1 className="page-title">Transactions</h1>
            <p className="page-subtitle">
              Review and manage your financial asset movements.
            </p>
          </div>

          <div className="page-actions transactions-actions">
            <button
              className="btn btn-secondary secondary-action"
              onClick={() => {
                setEditingId(null)
                setActivePanel(activePanel === 'category' ? null : 'category')
              }}
            >
              + Create Category
            </button>

            <button
              className="btn btn-primary primary-action"
              onClick={() => {
                setEditingId(null)
                setForm(defaultForm)
                setActivePanel(
                  activePanel === 'transaction' ? null : 'transaction'
                )
              }}
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {activePanel === 'transaction' && (
          <form
            className="app-card app-card-p floating-form-card"
            onSubmit={handleSubmitTransaction}
          >
            <div className="card-header form-title-row">
              <h2>{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm cancel-edit-btn"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {!editingId && (
              <div className="receipt-upload-box">
                <div>
                  <label className="form-label">Upload Receipt</label>
                  <p className="receipt-upload-text">
                    Upload struk belanja untuk mengisi transaksi otomatis.
                  </p>
                </div>

                <div className="receipt-upload-actions">
                  <input
                    className="form-control"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => setReceiptFile(e.target.files[0])}
                  />

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleScanReceipt}
                    disabled={isScanningReceipt}
                  >
                    {isScanningReceipt ? 'Scanning...' : 'Scan Receipt'}
                  </button>
                </div>
              </div>
            )}

            <div className="form-grid">
              <div>
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  type="text"
                  name="description"
                  placeholder="Example: Coffee, Salary"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Type</label>
                <select
                  className="form-control"
                  name="type"
                  value={form.type}
                  onChange={handleTypeChange}
                  disabled={!!form.goal_id}
                >
                  <option value="income">Income / Pemasukan</option>
                  <option value="expense">Expense / Pengeluaran</option>
                </select>
              </div>

              <div>
                <label className="form-label">Amount</label>
                <input
                  className="form-control"
                  type="text"
                  name="amount"
                  placeholder="Example: Rp 100.000"
                  value={form.amount ? `Rp ${formatRupiah(form.amount)}` : ''}
                  onChange={handleChange}
                  required
                />
              </div>

              {!form.goal_id && (
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
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
              )}

              {form.goal_id && (
                <div>
                  <label className="form-label">Category</label>
                  <input
                    className="form-control"
                    type="text"
                    value="Savings"
                    disabled
                  />
                </div>
              )}

              <div>
                <label className="form-label">Allocate to Goal</label>
                <select
                  className="form-control"
                  name="goal_id"
                  value={form.goal_id}
                  onChange={handleChange}
                >
                  <option value="">No Goal</option>

                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Date</label>
                <input
                  className="form-control"
                  type="date"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <input
                  className="form-control"
                  type="text"
                  name="notes"
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full submit-action"
            >
              {editingId ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </form>
        )}

        {activePanel === 'category' && (
          <form
            className="app-card app-card-p floating-form-card"
            onSubmit={handleCreateCategory}
          >
            <h2>Create Category</h2>

            <div className="form-grid">
              <div>
                <label className="form-label">Category Name</label>
                <input
                  className="form-control"
                  type="text"
                  name="name"
                  placeholder="Example: Coffee"
                  value={categoryForm.name}
                  onChange={handleCategoryChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Type</label>
                <select
                  className="form-control"
                  name="type"
                  value={categoryForm.type}
                  onChange={handleCategoryChange}
                >
                  <option value="income">Income / Pemasukan</option>
                  <option value="expense">Expense / Pengeluaran</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full submit-action"
            >
              Save Category
            </button>
          </form>
        )}

        <div className="transactions-overview">
          <div className="app-card filter-card transaction-filter-panel">
            <div className="filter-field">
              <label className="filter-label">Search</label>
              <input
                className="form-control"
                type="text"
                name="search"
                placeholder="Search transaction"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-field">
              <label className="filter-label">Type</label>
              <select
                className="form-control"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="all">All Type</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label">Category</label>
              <select
                className="form-control"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="all">All Category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label">Period</label>
              <select
                className="form-control"
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary filter-reset-btn"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          </div>

          <div className="app-card metric-card summary-card">
            <span>Monthly Outflow</span>
            <h2>Rp {monthlyOutflow.toLocaleString('id-ID')}</h2>
            <p>Based on recorded expenses</p>
          </div>
        </div>

        <div className="app-card table-card transactions-table-card">
          <table className="app-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="transaction-name">
                        <div
                          className={`transaction-icon ${
                            item.type === 'income'
                              ? 'transaction-icon-income'
                              : 'transaction-icon-expense'
                          }`}
                        >
                          {item.type === 'income' ? '↗' : '↘'}
                        </div>

                        <div>
                          <strong>{item.description || 'No description'}</strong>
                          <span>Transaction ID: #{item.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-neutral category-badge">
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

                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-secondary btn-sm edit-btn"
                          onClick={() => handleEditTransaction(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-danger btn-sm delete-btn"
                          onClick={() => handleDeleteTransaction(item.id)}
                        >
                          Delete
                        </button>
                      </div>
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
          </div>
        </div>
      </div>
    </MainLayout>
  )
}