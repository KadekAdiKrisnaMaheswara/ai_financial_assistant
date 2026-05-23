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
  Cell,
  CartesianGrid,
} from 'recharts'

import MainLayout from '../../components/layout/MainLayout'
import api from '../../api/axios'
import '../../styles/components.css'
import './Analytics.css'

export default function Analytics() {
  const [transactions, setTransactions] = useState([])
  const token = localStorage.getItem('token')

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await api.get('/transactions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const savingRatio = totalIncome > 0
    ? Math.round((netFlow / totalIncome) * 100)
    : 0

  const expenseTransactions = transactions.filter(
    (item) => item.type === 'expense'
  )

  const uniqueExpenseDays = new Set(
    expenseTransactions
      .filter((item) => item.transaction_date)
      .map((item) =>
        new Date(item.transaction_date).toISOString().split('T')[0]
      )
  ).size

  const averageDailyExpense = uniqueExpenseDays > 0
    ? totalExpense / uniqueExpenseDays
    : 0

  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]

    const data = months.map((month) => ({
      month,
      income: 0,
      expense: 0,
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

    return Object.entries(result)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        value,
        color: ['#0057ff', '#3b82f6', '#93c5fd', '#dbeafe', '#1d4ed8'][
          index % 5
        ],
      }))
  }, [transactions])

  const topCategory = categoryAllocation[0]

  const riskLevel =
    totalExpense > totalIncome
      ? 'High'
      : totalExpense > totalIncome * 0.7
        ? 'Medium'
        : 'Low'

  return (
    <MainLayout>
      <div className="app-page analytics-page">
        <div className="page-header analytics-header">
          <div>
            <h1 className="page-title">Analytics Hub</h1>
            <p className="page-subtitle">
              Deep financial diagnostics, spending behavior, and category-level
              performance analysis.
            </p>
          </div>
        </div>

        <div className="analytics-stats">
          <div className="app-card metric-card analytics-card">
            <span>Saving Ratio</span>
            <h2>{savingRatio}%</h2>
            <p className={savingRatio >= 20 ? 'text-success positive' : 'text-danger negative'}>
              {savingRatio >= 20 ? 'Healthy saving margin' : 'Needs improvement'}
            </p>
          </div>

          <div className="app-card metric-card analytics-card">
            <span>Avg Daily Expense</span>
            <h2>Rp {Math.round(averageDailyExpense).toLocaleString('id-ID')}</h2>
            <p className="neutral">Based on active spending days</p>
          </div>

          <div className="app-card metric-card analytics-card">
            <span>Top Spending</span>
            <h2>{topCategory?.name || '-'}</h2>
            <p className="neutral">
              {topCategory
                ? `Rp ${topCategory.value.toLocaleString('id-ID')}`
                : 'No expense data'}
            </p>
          </div>

          <div className="app-card metric-card analytics-card">
            <span>Risk Exposure</span>
            <h2>{riskLevel}</h2>
            <p className={riskLevel === 'High' ? 'text-danger negative' : 'text-success positive'}>
              {riskLevel === 'High' ? 'Needs attention' : 'Controlled spending'}
            </p>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="app-card app-card-p analytics-chart-card velocity-card">
            <div className="chart-header">
              <div>
                <h2>Income vs Expense Trend</h2>
                <p>Monthly comparison for deeper cashflow analysis.</p>
              </div>

              <div className="chart-legend">
                <span><i className="income-dot"></i> Income</span>
                <span><i className="expense-dot"></i> Expense</span>
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={monthlyData}
                  margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                  barGap={10}
                  barCategoryGap="28%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#6b7280',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#9ca3af',
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `${value / 1000000}jt`
                        : `${value / 1000}rb`
                    }
                  />

                  <Tooltip
                    cursor={{ fill: '#f3f6ff', radius: 12 }}
                    contentStyle={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '14px',
                      boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                      fontSize: '13px',
                    }}
                    formatter={(value, name) => [
                      `Rp ${Number(value).toLocaleString('id-ID')}`,
                      name === 'income' ? 'Income' : 'Expense',
                    ]}
                  />

                  <Bar
                    dataKey="income"
                    fill="#0057ff"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={42}
                  />

                  <Bar
                    dataKey="expense"
                    fill="#c7d2fe"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="app-card app-card-p analytics-chart-card allocation-card">
            <h2 className="card-title">Expense Allocation</h2>
            <p>Breakdown of spending by category.</p>

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
                      paddingAngle={2}
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

        <div className="app-card category-performance-card">
          <div className="card-header analytics-table-header">
            <div>
              <h2 className="card-title">Category Performance</h2>
              <p>Detailed expense contribution by category.</p>
            </div>
          </div>

          <table className="app-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Spending</th>
                <th>Contribution</th>
                <th>Evaluation</th>
              </tr>
            </thead>

            <tbody>
              {categoryAllocation.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-table">
                    No category data available.
                  </td>
                </tr>
              ) : (
                categoryAllocation.map((item) => {
                  const percentage =
                    totalExpense > 0
                      ? Math.round((item.value / totalExpense) * 100)
                      : 0

                  return (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>Rp {item.value.toLocaleString('id-ID')}</td>
                      <td>{percentage}%</td>
                      <td>
                        <span
                          className={
                            percentage >= 40
                              ? 'status-badge status-danger'
                              : percentage >= 25
                                ? 'status-badge status-warning'
                                : 'status-badge status-safe'
                          }
                        >
                          {percentage >= 40
                            ? 'Dominant'
                            : percentage >= 25
                              ? 'Watch'
                              : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  )
}