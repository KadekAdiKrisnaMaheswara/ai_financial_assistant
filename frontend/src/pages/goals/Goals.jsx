import { useCallback, useEffect, useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../api/axios'
import '../../styles/components.css'
import './goals.css'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [useDeadline, setUseDeadline] = useState(false)

  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    status: 'active',
  })

  const token = localStorage.getItem('token')

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const fetchGoals = useCallback(async () => {
    try {
      const res = await api.get('/goals', authHeader)
      setGoals(res.data)
    } catch (error) {
      console.log(error)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchGoals()
    }
  }, [fetchGoals, token])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const resetForm = () => {
    setForm({
      name: '',
      target_amount: '',
      current_amount: '',
      deadline: '',
      status: 'active',
    })

    setUseDeadline(false)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      name: form.name,
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount || 0),
      deadline: useDeadline ? form.deadline : null,
      status: form.status,
    }

    try {
      if (editingId) {
        await api.put(`/goals/${editingId}`, payload, authHeader)
        alert('Goal berhasil diupdate')
      } else {
        await api.post('/goals', payload, authHeader)
        alert('Goal berhasil dibuat')
      }

      resetForm()
      fetchGoals()
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal menyimpan goal')
    }
  }

  const handleEdit = (goal) => {
    setEditingId(goal.id)
    setUseDeadline(Boolean(goal.deadline))
    setShowForm(true)

    setForm({
      name: goal.name,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      deadline: goal.deadline
        ? new Date(goal.deadline).toISOString().split('T')[0]
        : '',
      status: goal.status,
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this goal?'
    )

    if (!confirmDelete) return

    try {
      await api.delete(`/goals/${id}`, authHeader)
      alert('Goal berhasil dihapus')
      fetchGoals()
    } catch (error) {
      console.log(error)
      alert(error.response?.data?.message || 'Gagal hapus goal')
    }
  }

  return (
    <MainLayout>
      <div className="app-page goals-page">
        <div className="page-header goals-header">
          <div>
            <h1 className="page-title">Financial Goals</h1>
            <p className="page-subtitle">Track your savings targets and monitor progress.</p>
          </div>

          <button
            className="btn btn-primary goal-btn"
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
            }}
          >
            + Create Goal
          </button>
        </div>

        {showForm && (
          <form className="app-card app-card-p goal-form-card" onSubmit={handleSubmit}>
            <div className="card-header goal-form-header">
              <h2>{editingId ? 'Edit Goal' : 'Create Goal'}</h2>

              <button
                type="button"
                className="btn btn-secondary btn-sm goal-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>

            <div className="form-grid goal-form-grid">
              <div>
                <label className="form-label">Goal Name</label>
                <input className="form-control"
                  type="text"
                  name="name"
                  placeholder="Example: Emergency Fund"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Target Amount</label>
                <input className="form-control"
                  type="number"
                  name="target_amount"
                  placeholder="Example: 10000000"
                  value={form.target_amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Current Amount</label>
                <input className="form-control"
                  type="number"
                  name="current_amount"
                  placeholder="Example: 2500000"
                  value={form.current_amount}
                  onChange={handleChange}
                />
              </div>

<div>
  <label className="form-label">Deadline Option</label>
  <select className="form-control"
    value={useDeadline ? 'yes' : 'no'}
    onChange={(e) => {
      const isUsingDeadline = e.target.value === 'yes'
      setUseDeadline(isUsingDeadline)

      if (!isUsingDeadline) {
        setForm({
          ...form,
          deadline: '',
        })
      }
    }}
  >
    <option value="no">No Deadline</option>
    <option value="yes">Set Deadline</option>
  </select>
</div>

{useDeadline && (
  <div>
    <label className="form-label">Deadline</label>
    <input className="form-control"
      type="date"
      name="deadline"
      value={form.deadline}
      onChange={handleChange}
      required
    />
  </div>
)}

              <div>
                <label className="form-label">Status</label>
                <select className="form-control"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-full goal-submit-btn" type="submit">
              {editingId ? 'Update Goal' : 'Save Goal'}
            </button>
          </form>
        )}

        {goals.length === 0 ? (
          <div className="app-card app-card-p empty-state goal-empty-card">
            <h2>No financial goals yet.</h2>
            <p>Create your first savings target to start tracking progress.</p>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => {
              const target = Number(goal.target_amount)
              const current = goal.transactions
  ? goal.transactions.reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    )
  : 0
              const percentage =
                target > 0 ? Math.min((current / target) * 100, 100) : 0

              return (
                <div className="app-card app-card-p goal-card" key={goal.id}>
                  <div className="goal-top">
                    <div>
                      <h3>{goal.name}</h3>
                      <p>
                        {goal.deadline
                          ? `Deadline: ${new Date(goal.deadline).toLocaleDateString('id-ID')}`
                          : 'No deadline'}
                      </p>
                    </div>

                    <span>{Math.round(percentage)}%</span>
                  </div>

                  <div className="progress-track goal-progress">
                    <div
                      className="progress-fill goal-progress-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    ></div>
                  </div>

                  <div className="goal-info">
                    <div>
                      <p>Saved</p>
                      <h4>Rp {current.toLocaleString('id-ID')}</h4>
                    </div>

                    <div>
                      <p>Target</p>
                      <h4>Rp {target.toLocaleString('id-ID')}</h4>
                    </div>
                  </div>

                  <div className="goal-card-footer">
                    <span className={`status-badge status-${goal.status} goal-status ${goal.status}`}>
                      {goal.status}
                    </span>

                    <div>
                      <button
                        className="btn btn-secondary btn-sm goal-edit-btn"
                        onClick={() => handleEdit(goal)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger btn-sm goal-delete-btn"
                        onClick={() => handleDelete(goal.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}