import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Package, ShoppingBag, Landmark, AlertCircle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const PERIODS = ['Today', 'Week', 'Month', 'Year', 'All']

function StatCard({ icon: Icon, label, value, sub, color, to }) {
  const card = (
    <div className={`bg-white rounded-xl p-5 shadow-sm border border-${color}-100 hover:shadow-md transition-shadow`}>
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-${color}-100 mb-3`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

function periodStart(period) {
  const now = new Date()
  if (period === 'Today') { const d = new Date(now); d.setHours(0,0,0,0); return d.toISOString() }
  if (period === 'Week') { const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d.toISOString() }
  if (period === 'Month') { const d = new Date(now); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString() }
  if (period === 'Year') { const d = new Date(now); d.setMonth(0,1); d.setHours(0,0,0,0); return d.toISOString() }
  return null
}

export default function Dashboard() {
  const [period, setPeriod] = useState('Month')
  const [stats, setStats] = useState({ inventory: 0, sales: 0, salePending: 0, loanPending: 0, activeLoans: 0 })
  const [recentSales, setRecentSales] = useState([])
  const [recentLoans, setRecentLoans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const start = periodStart(period)

      const [inv, sales, loans, loanEntries] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        start
          ? supabase.from('sales').select('final_price_with_gst, pending_amount, date').gte('date', start.split('T')[0])
          : supabase.from('sales').select('final_price_with_gst, pending_amount, date'),
        supabase.from('loan_entries').select('id, loan_amount, monthly_interest, loan_date, loan_cleared_date, amount_submitted, customer_name'),
        supabase.from('loan_entries').select('id, customer_name, loan_amount, loan_cleared_date, date').order('date', { ascending: false }).limit(5),
      ])

      const salesData = sales.data || []
      const loansData = loans.data || []

      const totalSales = salesData.reduce((s, r) => s + (r.final_price_with_gst || 0), 0)
      const salePending = salesData.reduce((s, r) => s + (r.pending_amount || 0), 0)

      // Active loans pending (outstanding loan amounts)
      const activeLoansData = loansData.filter(r => !r.loan_cleared_date)
      const loanPending = activeLoansData.reduce((s, r) => s + (r.loan_amount || 0), 0)

      setStats({
        inventory: inv.count || 0,
        sales: totalSales,
        salePending,
        loanPending,
        activeLoans: activeLoansData.length,
      })

      const { data: recent } = await supabase.from('sales').select('*').order('date', { ascending: false }).limit(5)
      setRecentSales(recent || [])
      setRecentLoans(loanEntries.data || [])
      setLoading(false)
    }
    load()
  }, [period])

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

  return (
    <div>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">SRK Jewellers management panel</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${period === p ? 'bg-white shadow text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard icon={Package} label="Inventory Items" value={stats.inventory} color="amber" to="/inventory" />
            <StatCard icon={TrendingUp} label={`${period} Sales`} value={fmt(stats.sales)} color="green" to="/sales" />
            <StatCard icon={AlertCircle} label="Sale Pending" value={fmt(stats.salePending)} color="red" to="/sales" />
            <StatCard icon={Landmark} label="Loan Outstanding" value={fmt(stats.loanPending)} color="purple" to="/loans" />
            <StatCard icon={Landmark} label="Active Loans" value={stats.activeLoans} color="blue" to="/loans" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-amber-600" /> Recent Sales
                </h2>
                <Link to="/sales" className="text-xs text-amber-600 hover:underline">View all</Link>
              </div>
              {recentSales.length === 0 ? (
                <p className="text-gray-400 text-sm">No sales recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentSales.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{s.customer_name}</div>
                        <div className="text-xs text-gray-400">{s.invoice_id} · {s.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700">{fmt(s.final_price_with_gst)}</div>
                        {s.pending_amount > 0
                          ? <div className="text-xs text-red-500">{fmt(s.pending_amount)} due</div>
                          : <div className="text-xs text-green-500">Paid</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Loan Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Landmark size={16} className="text-blue-600" /> Recent Loans
                </h2>
                <Link to="/loans" className="text-xs text-amber-600 hover:underline">View all</Link>
              </div>
              {recentLoans.length === 0 ? (
                <p className="text-gray-400 text-sm">No loans recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentLoans.map(l => (
                    <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{l.customer_name}</div>
                        <div className="text-xs text-gray-400">{l.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700">{fmt(l.loan_amount)}</div>
                        {l.loan_cleared_date
                          ? <div className="text-xs text-green-500">Cleared</div>
                          : <div className="text-xs text-orange-500">Active</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
