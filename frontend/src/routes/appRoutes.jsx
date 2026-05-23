import { Routes, Route, Navigate } from 'react-router-dom'

import LandingPage from '../pages/landingpage/LandingPage'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/profile/Profile'
import Transactions from '../pages/transactions/Transactions'
import Analytics from '../pages/analytics/Analytics'
import AIAssistant from '../pages/ai-assistant/AIAssistant'
import Budgets from '../pages/budgets/Budgets'
import Goals from '../pages/goals/Goals'
import ProtectedRoute from './ProtectedRoute'

const AppRoutes = () => {
  const token = localStorage.getItem('token')

  return (
    <Routes>
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard"  /> : <LandingPage />}
      />

      <Route
        path="/landingPage"
        element={token ? <Navigate to="/dashboard" /> : <LandingPage />}
      />

      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" /> : <Login />}
      />

      <Route
        path="/register"
        element={token ? <Navigate to="/dashboard" /> : <Register />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-assistant"
        element={
          <ProtectedRoute>
            <AIAssistant />
          </ProtectedRoute>
        }
      />

      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <Budgets />
          </ProtectedRoute>
        }
      />

      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes