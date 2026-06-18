import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import FormField from '../components/FormField'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const EMPTY = {
  book_number: '', loan_id: '', name: '', co: '', contact: '', address: '',
  aadhar: '', ref1: '', ref1_contact: '', ref2: '', ref2_contact: '',
  date_lended: '', metal_rate_per_gram: '', product_lended: '',
  product_metal: 'Gold', product_weight_gm: '', product_quality: '',
  srk_quality_consideration: '', final_product_weight: '',
  loan_amount: '', interest_rate: 2.5, partner: '',
  date_keeping: '', kept_amount: '', srk_interest: '',
  amount_submitted: '', date_submission: '', loan_cleared_date: '',
  remark: ''
}

function LoanRow({ loan, onEdit }) {
  const [open, setOpen] = useState(false)
  const fmt = n => n != null && n !== '' ? '₹' + Number(n).toLocaleString('en-IN') : '—'
  const isActive = !loan.loan_cleared_date

  return (
    <div className={`border rounded-xl mb-2 overflow-hidden ${isActive ? 'border-blue-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/50" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
          <div>
            <span className="font-mono text-xs text-blue-600 font-bold">{loan.loan_id || loan.book_number}</span>
            <span className="ml-2 text-sm text-gray-700 font-medium">{loan.name}</span>
            {loan.co && <span className="text-xs text-gray-400 ml-1">C/O {loan.co}</span>}
          </div>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 hidden sm:block">{loan.product_lended}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block ${loan.product_metal === 'Gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{loan.product_metal}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-800">{fmt(loan.loan_amount)}</div>
            <div className="text-xs text-gray-400">{loan.date_lended}</div>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Info label="Product" value={`${loan.product_lended} (${loan.product_metal})`} />
          <Info label="Weight" value={loan.product_weight_gm ? `${loan.product_weight_gm} gm` : '—'} />
          <Info label="Metal Rate/g" value={fmt(loan.metal_rate_per_gram)} />
          <Info label="Interest Rate" value={loan.interest_rate ? `${loan.interest_rate}%` : '—'} />
          <Info label="Address" value={loan.address || '—'} />
          <Info label="Contact" value={loan.contact || '—'} />
          <Info label="Aadhar" value={loan.aadhar || '—'} />
          <Info label="Partner" value={loan.partner || 'Self'} />
          <Info label="Kept On Amount" value={fmt(loan.kept_amount)} />
          <Info label="Amount Submitted" value={fmt(loan.amount_submitted)} />
          <Info label="Date Submission" value={loan.date_submission || '—'} />
          <Info label="Status" value={isActive ? 'Active' : `Cleared: ${loan.loan_cleared_date}`} />
          {loan.remark && <div className="col-span-2 md:col-span-4 text-xs text-gray-400 italic">{loan.remark}</div>}
          <div className="col-span-2 md:col-span-4">
            <button onClick={() => onEdit(loan)} className="text-xs text-blue-500 hover:underline">Edit this loan</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return <div><div className="text-xs text-gray-400">{label}</div><div className="font-medium text-gray-700">{value}</div></div>
}

export default function LoanLedger() {
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('active')
  const [search, setSearch] = useState('')

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }))

  const load = async () => {
    const { data } = await supabase.from('loan_entries').select('*').order('date_lended', { ascending: false })
    setLoans(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      product_weight_gm: Number(form.product_weight_gm) || null,
      metal_rate_per_gram: Number(form.metal_rate_per_gram) || null,
      loan_amount: Number(form.loan_amount) || null,
      interest_rate: Number(form.interest_rate) || null,
      kept_amount: Number(form.kept_amount) || null,
      srk_interest: Number(form.srk_interest) || null,
      amount_submitted: Number(form.amount_submitted) || null,
      loan_cleared_date: form.loan_cleared_date || null,
    }
    if (form.id) await supabase.from('loan_entries').update(payload).eq('id', form.id)
    else await supabase.from('loan_entries').insert(payload)
    await load()
    setShowForm(false)
    setForm(EMPTY)
    setSaving(false)
  }

  const filtered = loans.filter(l => {
    const matchFilter = filter === 'all' || (filter === 'active' ? !l.loan_cleared_date : l.loan_cleared_date)
    const matchSearch = !search || [l.name, l.loan_id, l.product_lended, l.book_number].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchFilter && matchSearch
  })
  const activeCount = loans.filter(l => !l.loan_cleared_date).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Loan Ledger</h1>
          <p className="text-gray-500 text-sm">{activeCount} active loans · {loans.length} total</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus size={16} /> New Loan
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {['active', 'cleared', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize ${filter === f ? 'bg-amber-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-amber-50'}`}>
            {f}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, product..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 flex-1 min-w-40" />
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        filtered.length === 0 ? <p className="text-gray-400 text-sm">No loans found.</p> :
          filtered.map(l => <LoanRow key={l.id} loan={l} onEdit={l => { setForm(l); setShowForm(true) }} />)
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{form.id ? 'Edit' : 'New'} Loan Entry</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <FormField label="Book Number" name="book_number" value={form.book_number} onChange={set} />
              <FormField label="Loan ID" name="loan_id" value={form.loan_id} onChange={set} />
              <FormField label="Customer Name" name="name" value={form.name} onChange={set} />
              <FormField label="C/O (Guardian)" name="co" value={form.co} onChange={set} />
              <FormField label="Contact" name="contact" type="tel" value={form.contact} onChange={set} />
              <FormField label="Address" name="address" value={form.address} onChange={set} />
              <FormField label="Aadhar Number" name="aadhar" value={form.aadhar} onChange={set} />
              <FormField label="Reference 1" name="ref1" value={form.ref1} onChange={set} />
              <FormField label="Ref 1 Contact" name="ref1_contact" type="tel" value={form.ref1_contact} onChange={set} />
              <FormField label="Reference 2" name="ref2" value={form.ref2} onChange={set} />
              <FormField label="Ref 2 Contact" name="ref2_contact" type="tel" value={form.ref2_contact} onChange={set} />
              <FormField label="Date Lended" name="date_lended" type="date" value={form.date_lended} onChange={set} />

              <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jewellery Details</div>
              <FormField label="Product Lended" name="product_lended" value={form.product_lended} onChange={set} />
              <FormField label="Metal" name="product_metal" value={form.product_metal} onChange={set} options={['Gold', 'Silver']} />
              <FormField label="Weight (gm/mg)" name="product_weight_gm" type="number" value={form.product_weight_gm} onChange={set} />
              <FormField label="Quality" name="product_quality" type="number" value={form.product_quality} onChange={set} />
              <FormField label="SRK Quality Consideration" name="srk_quality_consideration" type="number" value={form.srk_quality_consideration} onChange={set} />
              <FormField label="Final Product Weight" name="final_product_weight" type="number" value={form.final_product_weight} onChange={set} />
              <FormField label="Metal Rate/Gram (₹)" name="metal_rate_per_gram" type="number" value={form.metal_rate_per_gram} onChange={set} />

              <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Loan Terms</div>
              <FormField label="Loan Amount (₹)" name="loan_amount" type="number" value={form.loan_amount} onChange={set} />
              <FormField label="Interest Rate (/100₹)" name="interest_rate" type="number" value={form.interest_rate} onChange={set} />
              <FormField label="Partner" name="partner" value={form.partner} onChange={set} />
              <FormField label="Date of Keeping" name="date_keeping" type="date" value={form.date_keeping} onChange={set} />
              <FormField label="Kept On Amount (₹)" name="kept_amount" type="number" value={form.kept_amount} onChange={set} />
              <FormField label="SRK Interest" name="srk_interest" type="number" value={form.srk_interest} onChange={set} />
              <FormField label="Amount Submitted (₹)" name="amount_submitted" type="number" value={form.amount_submitted} onChange={set} />
              <FormField label="Date of Submission" name="date_submission" type="date" value={form.date_submission} onChange={set} />
              <FormField label="Loan Cleared Date" name="loan_cleared_date" type="date" value={form.loan_cleared_date} onChange={set} />
              <FormField label="Remarks" name="remark" value={form.remark} onChange={set} col2 rows={2} />

              <div className="col-span-2 flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
