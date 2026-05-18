import { useCallback, useEffect, useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../api/axios'
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
      <div className="goals-page">
        <div className="goals-header">
          <div>
            <h1>Financial Goals</h1>
            <p>Track your savings targets and monitor progress.</p>
          </div>

          <button
            className="goal-btn"
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
            }}
          >
            + Create Goal
          </button>
        </div>

        {showForm && (
          <form className="goal-form-card" onSubmit={handleSubmit}>
            <div className="goal-form-header">
              <h2>{editingId ? 'Edit Goal' : 'Create Goal'}</h2>

              <button
                type="button"
                className="goal-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>

            <div className="goal-form-grid">
              <div>
                <label>Goal Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Example: Emergency Fund"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Target Amount</label>
                <input
                  type="number"
                  name="target_amount"
                  placeholder="Example: 10000000"
                  value={form.target_amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Current Amount</label>
                <input
                  type="number"
                  name="current_amount"
                  placeholder="Example: 2500000"
                  value={form.current_amount}
                  onChange={handleChange}
                />
              </div>

<div>
  <label>Deadline Option</label>
  <select
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
    <label>Deadline</label>
    <input
      type="date"
      name="deadline"
      value={form.deadline}
      onChange={handleChange}
      required
    />
  </div>
)}

              <div>
                <label>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <button className="goal-submit-btn" type="submit">
              {editingId ? 'Update Goal' : 'Save Goal'}
            </button>
          </form>
        )}

        {goals.length === 0 ? (
          <div className="goal-empty-card">
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
                <div className="goal-card" key={goal.id}>
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

                  <div className="goal-progress">
                    <div
                      className="goal-progress-fill"
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
                    <span className={`goal-status ${goal.status}`}>
                      {goal.status}
                    </span>

                    <div>
                      <button
                        className="goal-edit-btn"
                        onClick={() => handleEdit(goal)}
                      >
                        Edit
                      </button>

                      <button
                        className="goal-delete-btn"
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