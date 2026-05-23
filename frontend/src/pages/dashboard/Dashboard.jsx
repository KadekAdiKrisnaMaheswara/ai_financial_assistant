import { useCallback, useEffect, useMemo, useState } from 'react'
import { Wallet, Banknote, ShoppingCart, TrendingUp } from 'lucide-react'
import MainLayout from '../../components/layout/MainLayout'
import { exportFinancialReport } from '../../utils/exportFinancialReport'
import api from '../../api/axios'
import './Dashboard.css'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [budgets, setBudgets] = useState([])

  const token = localStorage.getItem('token')

  const authHeader = useMemo(() => {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }, [token])

const fetchTransactions = useCallback(async () => {
  try {
    const response = await api.get('/transactions', authHeader)
    setTransactions(response.data)
  } catch (error) {
    console.log(error)
  }
}, [authHeader])

  const fetchGoals = useCallback(async () => {
    try {
      const response = await api.get('/goals', authHeader)
      setGoals(response.data)
    } catch (error) {
      console.log(error)
    }
  }, [authHeader])

  const fetchBudgets = useCallback(async () => {
    try {
      const response = await api.get('/budgets', authHeader)
      setBudgets(response.data)
    } catch (error) {
      console.log(error)
    }
  }, [authHeader])

  useEffect(() => {
    if (token) {
      fetchTransactions()
      fetchGoals()
      fetchBudgets()
    }
  }, [fetchTransactions, fetchGoals, fetchBudgets, token])

  const formatCurrency = (value) => {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
  }

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
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]

    const data = months.map((month) => ({
      month,
      value: 0,
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

  const calculateBudgetSpent = (budget) => {
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

  const budgetSummary = useMemo(() => {
    return budgets.slice(0, 4).map((budget) => {
      const spent = calculateBudgetSpent(budget)
      const limit = Number(budget.limit_amount)
      const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0

      return {
        ...budget,
        spent,
        limit,
        percentage,
      }
    })
  }, [budgets, transactions])

  const goalSummary = useMemo(() => {
    return goals.slice(0, 4).map((goal) => {
      const target = Number(goal.target_amount)

      const saved = transactions
        .filter((transaction) => transaction.goal_id === goal.id)
        .reduce((total, transaction) => total + Number(transaction.amount), 0)

      const percentage = target > 0 ? Math.min((saved / target) * 100, 100) : 0

      return {
        ...goal,
        target,
        saved,
        percentage,
      }
    })
  }, [goals, transactions])

  const hasFinancialData =
  transactions.length > 0 ||
  budgets.length > 0 ||
  goals.length > 0

  const financialHealthScore = useMemo(() => {
    if (!hasFinancialData) return 0

    let score = 100

    if (totalExpenses > totalIncome) {
      score -= 30
    } else if (totalExpenses > totalIncome * 0.8) {
      score -= 15
    }

    const savingsRate = totalIncome > 0 ? (totalBalance / totalIncome) * 100 : 0

    if (savingsRate < 10) {
      score -= 20
    } else if (savingsRate < 20) {
      score -= 10
    }

    const overBudgetCount = budgetSummary.filter(
      (budget) => budget.spent > budget.limit
    ).length

    score -= overBudgetCount * 10

    const progressingGoals = goalSummary.filter(
      (goal) => goal.percentage >= 50
    ).length

    score += progressingGoals * 5

    return Math.max(0, Math.min(100, Math.round(score)))
  }, [hasFinancialData, totalIncome, totalExpenses, totalBalance, budgetSummary, goalSummary])

  const aiInsights = useMemo(() => {
    const insights = []

    if (transactions.length === 0) {
      return [
        {
          type: 'neutral',
          title: 'No Financial Data',
          description:
            'Start adding transactions to unlock AI-powered financial insights.',
        },
      ]
    }

    insights.push(
      totalExpenses > totalIncome
        ? {
            type: 'danger',
            title: 'Negative Cashflow',
            description: 'Your expenses are currently higher than your income.',
          }
        : {
            type: 'success',
            title: 'Healthy Cashflow',
            description: 'Your income is still higher than your expenses.',
          }
    )

    const expenseMap = {}

    transactions
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        const categoryName = item.category?.name || 'Uncategorized'
        expenseMap[categoryName] =
          (expenseMap[categoryName] || 0) + Number(item.amount)
      })

    const topExpenseCategory = Object.entries(expenseMap).sort(
      (a, b) => b[1] - a[1]
    )[0]

    if (topExpenseCategory) {
      insights.push({
        type: 'warning',
        title: 'Highest Spending Category',
        description: `${topExpenseCategory[0]} is your biggest expense category.`,
      })
    }

    budgetSummary.forEach((budget) => {
      if (budget.spent > budget.limit) {
        insights.push({
          type: 'danger',
          title: 'Budget Exceeded',
          description: `${
            budget.category?.name || 'Uncategorized'
          } budget exceeded the limit.`,
        })
      }
    })

    return insights.slice(0, 4)
  }, [transactions, totalIncome, totalExpenses, budgetSummary])

  const smartRecommendations = useMemo(() => {
    if (!hasFinancialData) return []

    const recommendations = []

    const overBudget = budgetSummary.filter(
      (budget) => budget.spent > budget.limit
    )

    if (overBudget.length > 0) {
      recommendations.push({
        type: 'danger',
        title: 'Budget Overspending',
        description: `You exceeded ${overBudget.length} active budget limit.`,
      })
    }

    const savingsRate = totalIncome > 0 ? (totalBalance / totalIncome) * 100 : 0

    if (savingsRate < 20) {
      recommendations.push({
        type: 'warning',
        title: 'Low Savings Rate',
        description: 'Try saving at least 20% of your monthly income.',
      })
    }

    const activeGoal = goalSummary.find((goal) => goal.percentage < 100)

    if (activeGoal) {
      const remaining = activeGoal.target - activeGoal.saved
      const suggestedSaving = Math.round(remaining / 6)

      recommendations.push({
        type: 'success',
        title: 'Goal Optimization',
        description: `Save ${formatCurrency(suggestedSaving)}/month to accelerate ${activeGoal.name}.`,
      })
    }

    if (recommendations.length === 0 && totalBalance > 0) {
      recommendations.push({
        type: 'success',
        title: 'Financial Condition Stable',
        description: 'Your current financial activity looks healthy.',
      })
    }

    return recommendations.slice(0, 4)
  }, [hasFinancialData, budgetSummary, goalSummary, totalIncome, totalBalance])

  return (
    <MainLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Financial Overview</h1>
            <p>Personal finance analysis based on your latest transactions.</p>
          </div>

          <div className="dashboard-actions">
            <div className="filter-buttons">
              <span>Realtime Financial Analytics</span>
            </div>

            <button
              className="export-report-btn"
              type="button"
              onClick={() =>
                exportFinancialReport({
                  totalBalance,
                  totalIncome,
                  totalExpenses,
                  budgets: budgetSummary,
                  goals: goalSummary,
                  transactions: recentTransactions,
                  insights: aiInsights,
                })
              }
            >
              Export Report
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="card health-score-card">
            <div className="health-score-top">
              <div>
                <h4>Financial Health</h4>
                <h2>{financialHealthScore}/100</h2>
              </div>

              <div
                className={`health-indicator ${
                  financialHealthScore >= 75
                    ? 'excellent'
                    : financialHealthScore >= 50
                      ? 'good'
                      : 'poor'
                }`}
              >
                {financialHealthScore >= 75
                  ? 'Excellent'
                  : financialHealthScore >= 50
                    ? 'Good'
                    : 'Poor'}
              </div>
            </div>

            <div className="health-progress">
              <div
                className={`health-progress-fill ${
                  financialHealthScore >= 75
                    ? 'excellent'
                    : financialHealthScore >= 50
                      ? 'good'
                      : 'poor'
                }`}
                style={{ width: `${financialHealthScore}%` }}
              ></div>
            </div>

            <p>
              AI-powered score based on savings, budget control, and financial stability.
            </p>
          </div>

          <div className="card premium-stat balance-stat">
            <div className="stat-title">
              <Wallet size={17} />
              <span>Total Balance</span>
            </div>

            <div className="stat-value-row">
              <h2>{formatCurrency(totalBalance)}</h2>
              <strong className={totalBalance >= 0 ? 'positive' : 'negative'}>
                {totalBalance >= 0 ? '+ Healthy' : '- Deficit'}
              </strong>
            </div>

            <div className="stat-divider"></div>

            <div className="stat-footer">
              <span>Updated from latest transactions</span>
              <TrendingUp size={17} />
            </div>
          </div>

          <div className="card premium-stat">
            <div className="stat-title">
              <Banknote size={17} />
              <span>Monthly Income</span>
            </div>

            <div className="stat-value-row">
              <h2>{formatCurrency(totalIncome)}</h2>
              <strong className="positive">+ Income</strong>
            </div>

            <div className="stat-progress">
              <div style={{ width: '85%' }}></div>
            </div>

            <p>Income recorded from all transactions</p>
          </div>

          <div className="card premium-stat">
            <div className="stat-title">
              <ShoppingCart size={17} />
              <span>Total Expenses</span>
            </div>

            <div className="stat-value-row">
              <h2>{formatCurrency(totalExpenses)}</h2>
              <strong className="negative">- Expense</strong>
            </div>

            <div className="stat-divider"></div>

            <div className="stat-footer">
              <span className="limit-badge">Expense Activity</span>
              <span>Managed spending</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card chart-card">
            <div className="card-header">
              <div>
                <h2>Cashflow Projection</h2>
                <p>Monthly net income vs expenses movement</p>
              </div>
            </div>

            <div className="dashboard-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyChartData}
                  margin={{ top: 28, right: 24, left: 4, bottom: 18 }}
                >
                  <defs>
                    <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#eef2f7"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) =>
                      Math.abs(value) >= 1000000
                        ? `${value / 1000000}jt`
                        : `${value / 1000}rb`
                    }
                  />

                  <Tooltip
                    cursor={{ stroke: '#bfdbfe', strokeWidth: 2 }}
                    contentStyle={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '16px',
                      boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
                      fontSize: '13px',
                    }}
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{
                      fontWeight: 800,
                      color: '#111827',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={4}
                    fill="url(#cashflowGradient)"
                    dot={{
                      r: 4,
                      strokeWidth: 3,
                      fill: '#ffffff',
                      stroke: '#2563eb',
                    }}
                    activeDot={{
                      r: 7,
                      strokeWidth: 3,
                      fill: '#2563eb',
                      stroke: '#ffffff',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="insight-panel">
            <div className="ai-card">
              <div className="ai-card-header">
                <h2>AI Insights</h2>
                <p>Personalized financial analysis based on your activity.</p>
              </div>

              <div className="ai-insight-list">
                {aiInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`ai-insight-item ${insight.type}`}
                  >
                    <h4>{insight.title}</h4>
                    <p>{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card recommendation-card">
              <div className="card-header">
                <div>
                  <h2>Smart Recommendations</h2>
                  <p>AI-generated financial suggestions.</p>
                </div>
              </div>

              <div className="recommendation-list">
                {smartRecommendations.map((item, index) => (
                  <div
                    key={index}
                    className={`recommendation-item ${item.type}`}
                  >
                    <div className="recommendation-dot"></div>

                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

<div className="card market-card">
  {hasFinancialData ? (
    <>
      <div className="status-top">
        <h4>Financial Status</h4>

        <div className="status-main">
          <h3>{totalBalance >= 0 ? 'STABLE' : 'NEEDS REVIEW'}</h3>

          <span className={totalBalance >= 0 ? 'status-badge healthy' : 'status-badge review'}>
            {totalBalance >= 0 ? 'Healthy' : 'Review'}
          </span>
        </div>
      </div>

      <div className="status-bottom">
        <span>Transactions analyzed</span>
        <strong>{transactions.length}</strong>
      </div>
    </>
  ) : (
    <div className="empty-card-state">
      <h3>No Financial Data</h3>
      <p>Add transactions to generate financial status.</p>
    </div>
  )}
</div>
</div>
          </div>
        </div>

        <div className="dashboard-summary-grid">
          <div className="card dashboard-mini-card">
            <div className="card-header">
              <div>
                <h2>Budget Overview</h2>
                <p>Active spending limits.</p>
              </div>
            </div>

            {budgetSummary.length === 0 ? (
              <div className="dashboard-empty">No budget configured yet.</div>
            ) : (
              <div className="dashboard-mini-list">
                {budgetSummary.slice(0, 3).map((budget) => (
                  <div className="dashboard-mini-item" key={budget.id}>
                    <div className="dashboard-mini-top">
                      <div>
                        <h4>{budget.category?.name || 'Uncategorized'}</h4>
                        <p>{formatCurrency(budget.spent)}</p>
                      </div>

                      <strong
                        className={
                          budget.spent > budget.limit
                            ? 'budget-danger'
                            : budget.percentage >= 75
                              ? 'budget-warning'
                              : 'budget-safe'
                        }
                      >
                        {budget.spent > budget.limit
                          ? 'Over'
                          : `${Math.round(budget.percentage)}%`}
                      </strong>
                    </div>

                    <div className="dashboard-progress-track">
                      <div
                        className={
                          budget.percentage >= 100
                            ? 'dashboard-progress-fill danger'
                            : budget.percentage >= 75
                              ? 'dashboard-progress-fill warning'
                              : 'dashboard-progress-fill'
                        }
                        style={{ width: `${budget.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card dashboard-mini-card">
            <div className="card-header">
              <div>
                <h2>Goals Progress</h2>
                <p>Financial target tracking.</p>
              </div>
            </div>

            {goalSummary.length === 0 ? (
              <div className="dashboard-empty">No financial goals yet.</div>
            ) : (
              <div className="dashboard-mini-list">
                {goalSummary.slice(0, 3).map((goal) => (
                  <div className="dashboard-mini-item" key={goal.id}>
                    <div className="dashboard-mini-top">
                      <div>
                        <h4>{goal.name}</h4>
                        <p>{formatCurrency(goal.saved)}</p>
                      </div>

                      <strong>{Math.round(goal.percentage)}%</strong>
                    </div>

                    <div className="dashboard-progress-track">
                      <div
                        className="dashboard-progress-fill goal"
                        style={{ width: `${goal.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card dashboard-mini-card">
            <div className="card-header">
              <div>
                <h2>Recent Transactions</h2>
                <p>Latest financial activity.</p>
              </div>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="dashboard-empty">No transactions yet.</div>
            ) : (
              <div className="dashboard-transaction-list">
                {recentTransactions.slice(0, 3).map((item) => (
                  <div className="dashboard-transaction-item" key={item.id}>
                    <div>
                      <h4>{item.description || 'No description'}</h4>
                      <p>{item.category?.name || 'Uncategorized'}</p>
                    </div>

                    <strong
                      className={item.type === 'income' ? 'positive' : 'negative'}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatCurrency(item.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </MainLayout>
  )
}

export default Dashboard