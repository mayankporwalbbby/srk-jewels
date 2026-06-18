import { useState, useEffect } from 'react'
import { useMetalPrices } from '../hooks/useMetalPrices'
import { RefreshCw } from 'lucide-react'

function CalcSection({ title, metalType, defaultRate, loading: priceLoading }) {
  const [rate, setRate] = useState('')
  const [weight, setWeight] = useState('')
  const [quality, setQuality] = useState(1)
  const [making, setMaking] = useState('')

  useEffect(() => {
    if (defaultRate) setRate(String(defaultRate))
  }, [defaultRate])

  const ratePerGram = metalType === 'Gold' ? (Number(rate) / 10) : Number(rate) / 1000
  const productRate = ratePerGram * Number(weight)
  const afterQuality = productRate * Number(quality)
  const makingCharges = Number(making) * Number(weight)
  const totalWithoutGST = afterQuality + makingCharges
  const gstAmt = totalWithoutGST * 0.03
  const finalAmt = totalWithoutGST + gstAmt

  const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${metalType === 'Gold' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
        {title}
      </h2>
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quality (purity 0–1)</label>
          <input type="number" step="0.01" min="0" max="1" value={quality} onChange={e => setQuality(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Making Charges/Gram (₹)</label>
          <input type="number" value={making} onChange={e => setMaking(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0" />
        </div>
      </div>

      <div className="bg-amber-50 rounded-lg p-4 space-y-2 text-sm">
        <Row label="Product Rate" value={fmt(productRate)} />
        <Row label="After Quality Check" value={fmt(afterQuality)} />
        <Row label="Making Charges" value={fmt(makingCharges)} />
        <Row label="Total (without GST)" value={fmt(totalWithoutGST)} />
        <Row label="GST 3%" value={fmt(gstAmt)} />
        <div className="border-t border-amber-200 pt-2 flex justify-between font-bold text-amber-800">
          <span>Final Amount</span>
          <span>{fmt(finalAmt)}</span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span><span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}

export default function SellingCalculator() {
  const { gold10g, silverKg, loading } = useMetalPrices()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Selling Calculator</h1>
      <p className="text-gray-500 text-sm mb-6">
        Gold &amp; silver rates auto-filled from live prices — you can edit them manually too
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CalcSection title="Gold Jewellery" metalType="Gold" defaultRate={gold10g} loading={loading} />
        <CalcSection title="Silver Jewellery" metalType="Silver" defaultRate={silverKg} loading={loading} />
      </div>
    </div>
  )
}
