import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportFinancialReport = ({
  totalBalance,
  totalIncome,
  totalExpenses,
  budgets,
  goals,
  transactions,
  insights,
}) => {
  const doc = new jsPDF()

  const today = new Date().toLocaleDateString('id-ID')

  doc.setFontSize(24)
  doc.text('AIVEST Financial Report', 14, 22)

  doc.setFontSize(11)
  doc.setTextColor(120)

  doc.text(`Generated on ${today}`, 14, 30)

  // SUMMARY
  doc.setFontSize(16)
  doc.setTextColor(0)

  doc.text('Financial Summary', 14, 45)

  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Total Balance', `Rp ${totalBalance.toLocaleString('id-ID')}`],
      ['Total Income', `Rp ${totalIncome.toLocaleString('id-ID')}`],
      ['Total Expenses', `Rp ${totalExpenses.toLocaleString('id-ID')}`],
    ],
  })

  // BUDGETS
  if (budgets.length > 0) {
    doc.text('Budget Overview', 14, doc.lastAutoTable.finalY + 16)

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Category', 'Spent', 'Limit', 'Progress']],
      body: budgets.map((budget) => [
        budget.category?.name || 'Uncategorized',
        `Rp ${budget.spent.toLocaleString('id-ID')}`,
        `Rp ${budget.limit.toLocaleString('id-ID')}`,
        `${Math.round(budget.percentage)}%`,
      ]),
    })
  }

  // GOALS
  if (goals.length > 0) {
    doc.text('Financial Goals', 14, doc.lastAutoTable.finalY + 16)

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Goal', 'Saved', 'Target', 'Progress']],
      body: goals.map((goal) => [
        goal.name,
        `Rp ${goal.saved.toLocaleString('id-ID')}`,
        `Rp ${goal.target.toLocaleString('id-ID')}`,
        `${Math.round(goal.percentage)}%`,
      ]),
    })
  }

  // TRANSACTIONS
  if (transactions.length > 0) {
    doc.text('Recent Transactions', 14, doc.lastAutoTable.finalY + 16)

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Description', 'Category', 'Type', 'Amount']],
      body: transactions.slice(0, 8).map((trx) => [
        trx.description || '-',
        trx.category?.name || '-',
        trx.type,
        `Rp ${Number(trx.amount).toLocaleString('id-ID')}`,
      ]),
    })
  }

  // AI INSIGHTS
  if (insights.length > 0) {
    doc.text('AI Insights', 14, doc.lastAutoTable.finalY + 16)

    insights.forEach((insight, index) => {
      doc.setFontSize(11)

      doc.text(
        `• ${insight.title}: ${insight.description}`,
        18,
        doc.lastAutoTable.finalY + 24 + index * 8
      )
    })
  }

  doc.save('AIVEST-Financial-Report.pdf')
}