import { Routes, Route } from 'react-router-dom'

import LandingPage from '../pages/landingpage/LandingPage'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/profile/Profile'
import Transactions from '../pages/transactions/Transactions'
import Portfolio from '../pages/transactions/Transactions'
import Analytics from '../pages/analytics/Analytics'
import AIAssistant from '../pages/ai-assistant/AIAssistant'
import Budgets from '../pages/budgets/Budgets'
import Goals from '../pages/goals/Goals'

function AppRoutes() {
  return (
    <Routes>
      <Route path='/' element={<LandingPage />} />
      <Route path='/landingPage' element={<LandingPage />} />
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/profile' element={<Profile />} />
      <Route path='/transactions' element={<Transactions />} />
      <Route path='/portfolio' element={<Portfolio />} />
      <Route path='/analytics' element={<Analytics />} />
      <Route path='/ai-assistant' element={<AIAssistant />} />
      <Route path='/budgets' element={<Budgets />} />
      <Route path='/goals' element={<Goals />} />
    </Routes>
  )
}

export default AppRoutes