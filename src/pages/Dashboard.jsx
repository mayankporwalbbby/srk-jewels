import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Package, ShoppingBag, Landmark, AlertCircle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

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

export default function Dashboard() {
  const [stats, setStats] = useState({ inventory: 0, totalSales: 0, pendingAmount: 0, activeLoans: 0, todaySales: 0 })
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [inv, sales, loans] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('final_price_with_gst, pending_amount, date'),
        supabase.from('loan_entries').select('id, loan_cleared_date', { count: 'exact' }),
      ])

      const today = new Date().toISOString().split('T')[0]
      const salesData = sales.data || []
      const totalSales = salesData.reduce((s, r) => s + (r.final_price_with_gst || 0), 0)
      const pendingAmount = salesData.reduce((s, r) => s + (r.pending_amount || 0), 0)
      const todaySales = salesData.filter(r => r.date?.startsWith(today)).reduce((s, r) => s + (r.final_price_with_gst || 0), 0)
      const activeLoans = (loans.data || []).filter(r => !r.loan_cleared_date).length

      setStats({ inventory: inv.count || 0, totalSales, pendingAmount, activeLoans, todaySales })

      const { data: recent } = await supabase.from('sales').select('*').order('date', { ascending: false }).limit(5)
      setRecentSales(recent || [])
      setLoading(false)
    }
    load()
  }, [])

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

  if (loading) return <div className="text-gray-500 text-sm">Loading dashboard...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Welcome to SRK Jewellers management panel</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Inventory Items" value={stats.inventory} color="amber" to="/inventory" />
        <StatCard icon={TrendingUp} label="Today's Sales" value={fmt(stats.todaySales)} color="green" to="/sales" />
        <StatCard icon={AlertCircle} label="Pending Collection" value={fmt(stats.pendingAmount)} color="red" to="/sales" />
        <StatCard icon={Landmark} label="Active Loans" value={stats.activeLoans} color="blue" to="/loans" />
      </div>

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-2 font-medium">Invoice</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-amber-50">
                    <td className="py-2 text-amber-700 font-mono text-xs">{s.invoice_id}</td>
                    <td className="py-2">{s.customer_name}</td>
                    <td className="py-2 text-gray-500">{s.product_bought}</td>
                    <td className="py-2 text-right font-medium">{fmt(s.final_price_with_gst)}</td>
                    <td className={`py-2 text-right ${s.pending_amount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {s.pending_amount > 0 ? fmt(s.pending_amount) : 'Paid'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
