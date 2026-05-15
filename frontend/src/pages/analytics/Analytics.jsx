import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

import MainLayout from '../../components/layout/MainLayout'
import api from '../../api/axios'

import './Analytics.css'

export default function Analytics() {
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

  const totalExpense = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'expense')
      .reduce((total, item) => total + Number(item.amount), 0)
  }, [transactions])

  const netFlow = totalIncome - totalExpense

  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const data = months.map((month) => ({
      month,
      income: 0,
      expense: 0
    }))

    transactions.forEach((item) => {
      if (!item.transaction_date) return

      const date = new Date(item.transaction_date)
      const monthIndex = date.getMonth()

      if (item.type === 'income') {
        data[monthIndex].income += Number(item.amount)
      } else {
        data[monthIndex].expense += Number(item.amount)
      }
    })

    return data
  }, [transactions])

  const categoryAllocation = useMemo(() => {
    const result = {}

    transactions
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        const categoryName = item.category?.name || 'Uncategorized'

        result[categoryName] =
          (result[categoryName] || 0) + Number(item.amount)
      })

    return Object.entries(result).map(([name, value], index) => ({
      name,
      value,
      color: ['#0057ff', '#3b82f6', '#93c5fd', '#dbeafe', '#1d4ed8'][index % 5]
    }))
  }, [transactions])

  const riskLevel =
    totalExpense > totalIncome
      ? 'High'
      : totalExpense > totalIncome * 0.7
        ? 'Med'
        : 'Low-Med'

  return (
    <MainLayout>
      <div className="analytics-page">
        <div className="analytics-header">
          <h1>Analytics Hub</h1>
          <p>
            High-precision overview of your financial performance and liquidity metrics.
          </p>
        </div>

        <div className="analytics-stats">
          <div className="analytics-card">
            <span>Total Income</span>
            <h2>Rp {totalIncome.toLocaleString('id-ID')}</h2>
            <p className="positive">↗ Income recorded</p>
          </div>

          <div className="analytics-card">
            <span>Monthly Net Flow</span>
            <h2>
              {netFlow >= 0 ? '+' : '-'} Rp {Math.abs(netFlow).toLocaleString('id-ID')}
            </h2>
            <p className={netFlow >= 0 ? 'positive' : 'negative'}>
              {netFlow >= 0 ? 'Healthy cashflow' : 'Expenses exceed income'}
            </p>
          </div>

          <div className="analytics-card">
            <span>Total Expense</span>
            <h2>Rp {totalExpense.toLocaleString('id-ID')}</h2>
            <p className="neutral">Spending activity</p>
          </div>

          <div className="analytics-card">
            <span>Risk Exposure</span>
            <h2>{riskLevel}</h2>
            <p className={riskLevel === 'High' ? 'negative' : 'positive'}>
              {riskLevel === 'High'
                ? 'Needs attention'
                : 'Optimized for safety'}
            </p>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="chart-card velocity-card">
            <div className="chart-header">
              <div>
                <h2>Capital Velocity</h2>
                <p>Monthly income vs. expenditures</p>
              </div>

              <div className="chart-legend">
                <span><i className="income-dot"></i> Income</span>
                <span><i className="expense-dot"></i> Expenses</span>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `Rp ${Number(value).toLocaleString('id-ID')}`
                    }
                  />
                  <Bar dataKey="income" radius={[8, 8, 0, 0]} fill="#0057ff" />
                  <Bar dataKey="expense" radius={[8, 8, 0, 0]} fill="#c7d2fe" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card allocation-card">
            <h2>Capital Allocation</h2>
            <p>Spending breakdown by category</p>

            <div className="donut-wrapper">
              {categoryAllocation.length === 0 ? (
                <div className="empty-chart">No expense data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryAllocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {categoryAllocation.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `Rp ${Number(value).toLocaleString('id-ID')}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="allocation-list">
              {categoryAllocation.map((item) => {
                const percentage =
                  totalExpense > 0
                    ? Math.round((item.value / totalExpense) * 100)
                    : 0

                return (
                  <div className="allocation-item" key={item.name}>
                    <span>
                      <i style={{ background: item.color }}></i>
                      {item.name}
                    </span>

                    <strong>{percentage}%</strong>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}