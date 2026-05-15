import { useCallback, useEffect, useMemo, useState } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import api from '../../api/axios'
import './Dashboard.css'

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const token = localStorage.getItem('token')

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/transactions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setTransactions(response.data)
    } catch (error) {
      console.log(error)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchTransactions()
    }
  }, [fetchTransactions, token])

  const totalIncome = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'income')
      .reduce((total, item) => total + Number(item.amount), 0)
  }, [transactions])

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'expense')
      .reduce((total, item) => total + Number(item.amount), 0)
  }, [transactions])

  const totalBalance = totalIncome - totalExpenses

  const monthlyChartData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const data = months.map((month) => ({
      month,
      value: 0
    }))

    transactions.forEach((item) => {
      if (!item.transaction_date) return

      const date = new Date(item.transaction_date)
      const monthIndex = date.getMonth()

      if (item.type === 'income') {
        data[monthIndex].value += Number(item.amount)
      } else {
        data[monthIndex].value -= Number(item.amount)
      }
    })

    return data
  }, [transactions])

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
  }, [transactions])

  const aiInsight = useMemo(() => {
    if (transactions.length === 0) {
      return 'Start adding income and expense transactions to unlock personalized AI financial insights.'
    }

    if (totalExpenses > totalIncome) {
      return 'Your expenses are currently higher than your income. Consider reviewing non-essential spending categories this month.'
    }

    if (totalExpenses > totalIncome * 0.7) {
      return 'Your spending is approaching a high level compared to income. A monthly budget plan may help maintain financial stability.'
    }

    return 'Your cashflow looks healthy. You may consider allocating part of your remaining balance into savings or investment goals.'
  }, [transactions, totalIncome, totalExpenses])

  return (
    <MainLayout>
      <div className='dashboard'>
        <div className='dashboard-header'>
          <div>
            <h1>Financial Overview</h1>
            <p>Personal finance analysis based on your latest transactions.</p>
          </div>

          <div className='filter-buttons'>
            <span>Realtime Financial Analytics</span>
          </div>
        </div>

        <div className='stats-grid'>
          <div className='card stat-card'>
            <h4>Total Balance</h4>
            <h2>Rp {totalBalance.toLocaleString('id-ID')}</h2>
            <span className={totalBalance >= 0 ? 'positive' : 'negative'}>
              {totalBalance >= 0 ? '+ Healthy' : '- Deficit'}
            </span>
          </div>

          <div className='card stat-card'>
            <h4>Total Income</h4>
            <h2>Rp {totalIncome.toLocaleString('id-ID')}</h2>
            <span className='positive'>Income recorded</span>
          </div>

          <div className='card stat-card'>
            <h4>Total Expenses</h4>
            <h2>Rp {totalExpenses.toLocaleString('id-ID')}</h2>
            <span className='negative'>Expense activity</span>
          </div>
        </div>

        <div className='dashboard-grid'>
          <div className='card chart-card'>
            <div className='card-header'>
              <div>
                <h2>Cashflow Projection</h2>
                <p>Monthly net income vs expenses movement</p>
              </div>
            </div>

            <ResponsiveContainer width='100%' height={350}>
              <LineChart data={monthlyChartData}>
                <XAxis dataKey='month' />
                <Tooltip
                  formatter={(value) =>
                    `Rp ${Number(value).toLocaleString('id-ID')}`
                  }
                />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke='#2563eb'
                  strokeWidth={5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className='insight-panel'>
            <div className='ai-card'>
              <h2>AI Insight</h2>

              <p>{aiInsight}</p>

              <button className='white-btn'>Apply Strategy</button>
            </div>

            <div className='card market-card'>
              <h4>Financial Status</h4>
              <h3>
                {totalBalance >= 0 ? 'STABLE' : 'NEEDS REVIEW'}
              </h3>
              <p>
                {transactions.length} transactions analyzed
              </p>
            </div>
          </div>
        </div>

        <div className='card table-card'>
          <div className='card-header'>
            <h2>Recent Transactions</h2>
            <span className='link'>View All Activity</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan='5'>
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description || 'No description'}</td>

                    <td>
                      {item.category?.name || 'Uncategorized'}
                    </td>

                    <td>
                      {item.transaction_date
                        ? new Date(item.transaction_date).toLocaleDateString('id-ID')
                        : '-'}
                    </td>

                    <td className={item.type === 'income' ? 'positive' : 'negative'}>
                      {item.type === 'income' ? '+' : '-'} Rp{' '}
                      {Number(item.amount).toLocaleString('id-ID')}
                    </td>

                    <td>
                      <span className='badge'>Completed</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  )
}

export default Dashboard