import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import SalesLedger from './pages/SalesLedger'
import LoanLedger from './pages/LoanLedger'
import Customers from './pages/Customers'
import SellingCalculator from './pages/SellingCalculator'
import LoanCalculator from './pages/LoanCalculator'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-amber-700 text-lg font-medium">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={
          <ProtectedRoute session={session}>
            <Layout session={session} />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="sales" element={<SalesLedger />} />
          <Route path="loans" element={<LoanLedger />} />
          <Route path="customers" element={<Customers />} />
          <Route path="sell-calc" element={<SellingCalculator />} />
          <Route path="loan-calc" element={<LoanCalculator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
