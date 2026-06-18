import { useState, useEffect } from 'react'
import { useMetalPrices } from '../hooks/useMetalPrices'
import { RefreshCw } from 'lucide-react'

function CalcSection({ title, metalType, defaultRate, ltvPct, loading: priceLoading }) {
  const [rate, setRate] = useState('')
  const [weight, setWeight] = useState('')
  const [quality, setQuality] = useState(metalType === 'Gold' ? 0.75 : 1)

  useEffect(() => {
    if (defaultRate) setRate(String(defaultRate))
  }, [defaultRate])

  const ratePerGram = metalType === 'Gold' ? (Number(rate) / 10) : Number(rate) / 1000
  const productRate = ratePerGram * Number(weight)
  const afterQuality = productRate * Number(quality)
  const loanEligible = afterQuality * ltvPct

  const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${metalType === 'Gold' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
        {title}
      </h2>
      <p className="text-xs text-gray-400 mb-4">Loan eligibility: {ltvPct * 100}% of jewellery value</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            {metalType === 'Gold' ? 'Gold Rate (per 10g) ₹' : 'Silver Rate (per kg) ₹'}
            {priceLoading && <RefreshCw size={10} className="animate-spin text-amber-500" />}
          </label>
          <input type="number" value={rate} onChange={e => setRate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          {defaultRate && <p className="text-xs text-green-600 mt-0.5">Auto-filled from live rate</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Rate per Gram (₹)</label>
          <input readOnly value={ratePerGram ? ratePerGram.toFixed(3) : ''}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-amber-50 text-amber-800 font-medium" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Jewellery Weight (gm)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quality / Purity</label>
          <input type="number" step="0.01" min="0" max="1" value={quality} onChange={e => setQuality(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600"><span>Product Rate</span><span className="font-medium">{fmt(productRate)}</span></div>
        <div className="flex justify-between text-gray-600"><span>After Quality</span><span className="font-medium">{fmt(afterQuality)}</span></div>
        <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-blue-800 text-base">
          <span>Loan Eligible ({ltvPct * 100}%)</span>
          <span>{fmt(loanEligible)}</span>
        </div>
      </div>
    </div>
  )
}

export default function LoanCalculator() {
  const { gold10g, silverKg, loading } = useMetalPrices()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Loan Calculator</h1>
      <p className="text-gray-500 text-sm mb-6">
        Gold &amp; silver rates auto-filled from live prices — you can edit them manually too
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CalcSection title="Against Gold" metalType="Gold" defaultRate={gold10g} ltvPct={0.6} loading={loading} />
        <CalcSection title="Against Silver" metalType="Silver" defaultRate={silverKg} ltvPct={0.5} loading={loading} />
      </div>
    </div>
  )
}
