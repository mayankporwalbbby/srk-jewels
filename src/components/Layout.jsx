import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useMetalPrices } from '../hooks/useMetalPrices'
import {
  LayoutDashboard, Package, ShoppingBag, Landmark, Users,
  Calculator, HandCoins, LogOut, Menu, X, TrendingUp, RefreshCw
} from 'lucide-react'
import { useState } from 'react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/sales', label: 'Sales Ledger', icon: ShoppingBag },
  { to: '/loans', label: 'Loan Ledger', icon: Landmark },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/sell-calc', label: 'Sell Calculator', icon: Calculator },
  { to: '/loan-calc', label: 'Loan Calculator', icon: HandCoins },
]

function PriceBar() {
  const { gold10g, silverKg, loading, error, updatedAt } = useMetalPrices()
  const fmt = n => n ? '₹' + Number(n).toLocaleString('en-IN') : '...'
  const time = updatedAt ? updatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div className="bg-amber-800 text-amber-100 px-4 py-1.5 flex items-center justify-between text-xs flex-wrap gap-2">
      <div className="flex items-center gap-4">
        <span className="font-semibold text-amber-200 flex items-center gap-1">
          <TrendingUp size={11} /> Live Rates
        </span>
        <span>
          <span className="text-yellow-300 font-bold">Gold</span>
          <span className="ml-1 text-amber-100">(10g): </span>
          <span className="font-semibold">{loading ? '...' : error ? 'N/A' : fmt(gold10g)}</span>
        </span>
        <span>
          <span className="text-gray-300 font-bold">Silver</span>
          <span className="ml-1 text-amber-100">(kg): </span>
          <span className="font-semibold">{loading ? '...' : error ? 'N/A' : fmt(silverKg)}</span>
        </span>
      </div>
      {time && (
        <span className="text-amber-400 flex items-center gap-1">
          <RefreshCw size={10} /> Updated {time}
        </span>
      )}
      {error && <span className="text-red-300">{error}</span>}
    </div>
  )
}

export default function Layout({ session }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <PriceBar />
      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-amber-200 min-h-full">
          <div className="px-5 py-4 border-b border-amber-100">
            <div className="text-amber-800 font-bold text-lg leading-tight">SRK Jewellers</div>
            <div className="text-amber-500 text-xs mt-0.5">Shri Ram Krishna</div>
          </div>
          <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'}`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="px-4 pb-4 border-t border-amber-100 pt-3">
            <div className="text-xs text-gray-500 mb-2 truncate">{session?.user?.email}</div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="md:hidden fixed top-6 left-0 right-0 z-30 bg-white border-b border-amber-200 flex items-center justify-between px-4 py-3">
          <div className="text-amber-800 font-bold">SRK Jewellers</div>
          <button onClick={() => setOpen(!open)} className="text-gray-600">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="md:hidden fixed inset-0 z-20 bg-black/40 top-6" onClick={() => setOpen(false)}>
            <aside className="w-56 bg-white h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-amber-100">
                <div className="text-amber-800 font-bold text-lg">SRK Jewellers</div>
              </div>
              <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2">
                {nav.map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                      ${isActive ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-amber-50'}`
                    }
                  >
                    <Icon size={16} />{label}
                  </NavLink>
                ))}
              </nav>
              <div className="px-4 pb-4 border-t border-amber-100 pt-3">
                <div className="text-xs text-gray-500 mb-2 truncate">{session?.user?.email}</div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-500">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 mt-14 md:mt-0 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
