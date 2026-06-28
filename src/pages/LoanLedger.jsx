import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import FormField from '../components/FormField'
import { useMetalPrices } from '../hooks/useMetalPrices'
import { Plus, X, ChevronDown, ChevronUp, Phone, MessageCircle } from 'lucide-react'

const EMPTY = {
  book_number: '', loan_id: '', name: '', co: '', contact: '', address: '',
  aadhar: '', ref1: '', ref1_contact: '', ref2: '', ref2_contact: '',
  product_lended: '', product_metal: 'Gold', product_weight_gm: '',
  product_quality: '', srk_quality_consideration: '', final_product_weight: '',
  date_lended: new Date().toISOString().split('T')[0],
  metal_rate_per_gram: '', loan_amount: '', interest_rate: 2.5,
  gold_rate_at_lending: '',
  loan_type: 'Self', partner: '',
  partner_loan_amount: '', partner_interest_rate: 2.5,
  date_keeping: '', kept_amount: '', srk_interest: '',
  amount_submitted: '', date_submission: '', loan_cleared_date: '', remark: ''
}

function monthsDiff(from) {
  if (!from) return 0
  const start = new Date(from)
  const now = new Date()
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()))
}

function LoanRow({ loan, onEdit }) {
  const [open, setOpen] = useState(false)
  const [payments, setPayments] = useState([])
  const [newAmt, setNewAmt] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newNote, setNewNote] = useState('')
  const [addingPay, setAddingPay] = useState(false)
  const fmt = n => n != null && n !== '' ? '₹' + Number(n).toLocaleString('en-IN') : '—'
  const isActive = !loan.loan_cleared_date
  const months = monthsDiff(loan.date_lended)
  const monthlyInterest = loan.loan_amount && loan.interest_rate ? (loan.loan_amount * loan.interest_rate) / 100 : 0
  const totalInterest = monthlyInterest * months

  const loadPayments = async () => {
    const { data } = await supabase.from('loan_payments').select('*').eq('loan_id', loan.id).order('date')
    setPayments(data || [])
  }

  const handleOpen = () => {
    if (!open) loadPayments()
    setOpen(o => !o)
  }

  const totalSubmitted = payments.reduce((s, p) => s + (p.amount || 0), 0) + (loan.amount_submitted || 0)
  const totalDue = (loan.loan_amount || 0) + totalInterest - totalSubmitted

  const addPayment = async () => {
    if (!newAmt) return
    await supabase.from('loan_payments').insert({ loan_id: loan.id, amount: parseFloat(newAmt), date: newDate, note: newNote || null })
    setNewAmt(''); setNewNote(''); setAddingPay(false)
    loadPayments()
  }

  const deletePayment = async (id) => {
    if (!confirm('Delete this payment entry?')) return
    await supabase.from('loan_payments').delete().eq('id', id)
    loadPayments()
  }

  return (
    <div className={`border rounded-xl mb-2 overflow-hidden ${isActive ? 'border-blue-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/50" onClick={handleOpen}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
          <div>
            <span className="font-mono text-xs text-blue-600 font-bold">{loan.loan_id || loan.book_number}</span>
            <span className="ml-2 text-sm text-gray-700 font-medium">{loan.name}</span>
            {loan.co && <span className="text-xs text-gray-400 ml-1">C/O {loan.co}</span>}
          </div>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 hidden sm:block">{loan.product_lended}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block ${loan.product_metal === 'Gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{loan.product_metal}</span>
          {loan.loan_type === 'Partner' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Partner</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold">{fmt(loan.loan_amount)}</div>
            {isActive && <div className="text-xs text-orange-500">Due: {fmt(totalDue)}</div>}
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Info label="Product" value={`${loan.product_lended} (${loan.product_metal})`} />
            <Info label="Weight" value={loan.product_weight_gm ? `${loan.product_weight_gm} gm` : '—'} />
            <Info label="Date Lended" value={loan.date_lended || '—'} />
            <Info label="Metal Rate/g" value={fmt(loan.metal_rate_per_gram)} />
            <Info label="Loan Amount" value={fmt(loan.loan_amount)} />
            <Info label="Interest/Month" value={fmt(monthlyInterest)} />
            <Info label="Months Running" value={`${months} months`} />
            <Info label="Total Interest" value={fmt(totalInterest)} />
            <Info label="Gold Rate at Lending" value={loan.gold_rate_at_lending ? `₹${Number(loan.gold_rate_at_lending).toLocaleString('en-IN')}/10g` : '—'} />
            <Info label="Status" value={isActive ? 'Active' : `Cleared: ${loan.loan_cleared_date}`} />
            {loan.loan_type === 'Partner' && <Info label="Partner" value={loan.partner} />}
            {loan.contact && (
              <div className="col-span-2 flex gap-3">
                <a href={`tel:${loan.contact}`} className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><Phone size={12} /> Call</a>
                <a href={`https://wa.me/91${loan.contact?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-500 hover:underline"><MessageCircle size={12} /> WhatsApp</a>
              </div>
            )}
            {loan.remark && <div className="col-span-2 md:col-span-4 text-xs text-gray-400 italic">{loan.remark}</div>}
          </div>

          {/* Payment / Submission Ledger */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Repayment Ledger</div>
              <button onClick={() => setAddingPay(p => !p)} className="text-xs text-blue-600 font-medium hover:underline">+ Add Repayment</button>
            </div>

            {loan.amount_submitted > 0 && (
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{fmt(loan.amount_submitted)}</span>
                  <span className="text-xs text-gray-400 ml-2">{loan.date_submission || loan.date_lended} · Initial submission</span>
                </div>
              </div>
            )}

            {payments.map(p => (
              <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-gray-200 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{fmt(p.amount)}</span>
                  <span className="text-xs text-gray-400 ml-2">{p.date}{p.note ? ` · ${p.note}` : ''}</span>
                </div>
                <button onClick={() => deletePayment(p.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
              </div>
            ))}

            <div className="flex justify-between pt-2 text-sm font-semibold mt-1">
              <span className="text-gray-600">Total Submitted</span>
              <span className="text-green-600">{fmt(totalSubmitted)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-600">Total Due (with interest)</span>
              <span className={totalDue > 0 ? 'text-red-500' : 'text-green-500'}>{totalDue > 0 ? fmt(totalDue) : 'Cleared ✓'}</span>
            </div>

            {addingPay && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <input type="number" placeholder="Amount ₹" value={newAmt} onChange={e => setNewAmt(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                <input placeholder="Note (optional)" value={newNote} onChange={e => setNewNote(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                <button onClick={addPayment} className="col-span-3 bg-blue-600 text-white text-sm py-1.5 rounded-lg font-medium hover:bg-blue-700">Save Repayment</button>
              </div>
            )}
          </div>

          <button onClick={() => onEdit(loan)} className="text-xs text-blue-500 hover:underline">Edit</button>
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
  const { gold10g } = useMetalPrices()

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }))

  const load = async () => {
    const { data, error } = await supabase.from('loan_entries').select('*').order('created_at', { ascending: false })
    if (error) console.error('Load error:', error)
    setLoans(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const monthlyInterest = (parseFloat(form.loan_amount) || 0) * (parseFloat(form.interest_rate) || 0) / 100

    const payload = {
      book_number: form.book_number || null,
      loan_id: form.loan_id || null,
      name: form.name || null,
      co: form.co || null,
      contact: form.contact || null,
      address: form.address || null,
      aadhar: form.aadhar || null,
      ref1: form.ref1 || null,
      ref1_contact: form.ref1_contact || null,
      ref2: form.ref2 || null,
      ref2_contact: form.ref2_contact || null,
      product_lended: form.product_lended || null,
      product_metal: form.product_metal || 'Gold',
      product_weight_gm: parseFloat(form.product_weight_gm) || null,
      product_quality: parseFloat(form.product_quality) || null,
      srk_quality_consideration: parseFloat(form.srk_quality_consideration) || null,
      final_product_weight: parseFloat(form.final_product_weight) || null,
      date_lended: form.date_lended || null,
      metal_rate_per_gram: parseFloat(form.metal_rate_per_gram) || null,
      loan_amount: parseFloat(form.loan_amount) || null,
      interest_rate: parseFloat(form.interest_rate) || null,
      monthly_interest: monthlyInterest || null,
      gold_rate_at_lending: parseFloat(form.gold_rate_at_lending) || null,
      loan_type: form.loan_type || 'Self',
      partner: form.partner || null,
      partner_loan_amount: parseFloat(form.partner_loan_amount) || null,
      partner_interest_rate: parseFloat(form.partner_interest_rate) || null,
      date_keeping: form.date_keeping || null,
      kept_amount: parseFloat(form.kept_amount) || null,
      srk_interest: parseFloat(form.srk_interest) || null,
      amount_submitted: parseFloat(form.amount_submitted) || null,
      date_submission: form.date_submission || null,
      loan_cleared_date: form.loan_cleared_date || null,
      remark: form.remark || null,
    }

    let error
    if (form.id) {
      const result = await supabase.from('loan_entries').update(payload).eq('id', form.id)
      error = result.error
    } else {
      const result = await supabase.from('loan_entries').insert(payload)
      error = result.error
    }

    if (error) {
      alert('Error saving: ' + error.message)
      setSaving(false)
      return
    }

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
  const totalDueAll = filtered.filter(l => !l.loan_cleared_date).reduce((a, l) => {
    const months = monthsDiff(l.date_lended)
    const monthly = (l.loan_amount * l.interest_rate) / 100
    return a + (l.loan_amount || 0) + (monthly * months) - (l.amount_submitted || 0)
  }, 0)

  const isPartner = form.loan_type === 'Partner'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Loan Ledger</h1>
          <p className="text-gray-500 text-sm">{activeCount} active · Total Due: ₹{Number(totalDueAll).toLocaleString('en-IN')}</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY, gold_rate_at_lending: gold10g || '' }); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus size={16} /> New Loan
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['active', 'cleared', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize ${filter === f ? 'bg-amber-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
            {f}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, product..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 flex-1 min-w-36" />
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> :
        filtered.length === 0 ? <p className="text-gray-400 text-sm">No loans found.</p> :
          filtered.map(l => <LoanRow key={l.id} loan={l} onEdit={l => { setForm({ ...l, loan_type: l.loan_type || 'Self' }); setShowForm(true) }} />)
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{form.id ? 'Edit' : 'New'} Loan Entry</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">

              {/* Customer */}
              <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Details</div>
              <FormField label="Book Number" name="book_number" value={form.book_number} onChange={set} />
              <FormField label="Loan ID" name="loan_id" value={form.loan_id} onChange={set} />
              <FormField label="Customer Name" name="name" value={form.name} onChange={set} />
              <FormField label="C/O (Guardian)" name="co" value={form.co} onChange={set} />
              <FormField label="Contact" name="contact" type="tel" value={form.contact} onChange={set} />
              <FormField label="Address" name="address" value={form.address} onChange={set} />
              <FormField label="Aadhar Number" name="aadhar" value={form.aadhar} onChange={set} />
              <div />
              <FormField label="Reference 1" name="ref1" value={form.ref1} onChange={set} />
              <FormField label="Ref 1 Contact" name="ref1_contact" type="tel" value={form.ref1_contact} onChange={set} />
              <FormField label="Reference 2" name="ref2" value={form.ref2} onChange={set} />
              <FormField label="Ref 2 Contact" name="ref2_contact" type="tel" value={form.ref2_contact} onChange={set} />

              {/* Jewellery */}
              <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jewellery Details</div>
              <FormField label="Product Lended" name="product_lended" value={form.product_lended} onChange={set} />
              <FormField label="Metal" name="product_metal" value={form.product_metal} onChange={set} options={['Gold', 'Silver']} />
              <FormField label="Weight (gm/mg)" name="product_weight_gm" type="number" value={form.product_weight_gm} onChange={set} />
              <FormField label="Quality" name="product_quality" type="number" value={form.product_quality} onChange={set} />
              <FormField label="SRK Quality Consideration" name="srk_quality_consideration" type="number" value={form.srk_quality_consideration} onChange={set} />
              <FormField label="Final Product Weight" name="final_product_weight" type="number" value={form.final_product_weight} onChange={set} />
              <FormField label="Date Lended" name="date_lended" type="date" value={form.date_lended} onChange={set} />
              <FormField label="Metal Rate/Gram (₹)" name="metal_rate_per_gram" type="number" value={form.metal_rate_per_gram} onChange={set} />

              {/* Loan Type */}
              <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Loan Type</div>
              <FormField label="Loan Type" name="loan_type" value={form.loan_type} onChange={set} options={['Self', 'Partner']} />
              {isPartner && <FormField label="Partner Name" name="partner" value={form.partner} onChange={set} />}

              {/* Self Loan */}
              <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SRK Loan Details</div>
              <FormField label="Loan Amount (₹)" name="loan_amount" type="number" value={form.loan_amount} onChange={set} />
              <FormField label="Interest Rate (/100₹/month)" name="interest_rate" type="number" value={form.interest_rate} onChange={set} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gold Rate on Lending Day (₹/10g) <span className="text-xs font-normal text-amber-600">auto</span></label>
                <input type="number" value={form.gold_rate_at_lending || ''} onChange={e => set('gold_rate_at_lending', e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Auto-filled from live rate" />
              </div>
              <div />
              <div className="col-span-2 bg-blue-50 rounded-lg p-3 text-sm">
                <span className="text-gray-600">Monthly Interest: </span>
                <strong className="text-blue-700">₹{(((parseFloat(form.loan_amount) || 0) * (parseFloat(form.interest_rate) || 0)) / 100).toLocaleString('en-IN')}</strong>
                {form.date_lended && <span className="ml-3 text-gray-500">({monthsDiff(form.date_lended)} months running)</span>}
              </div>
              <FormField label="Amount Submitted (₹)" name="amount_submitted" type="number" value={form.amount_submitted} onChange={set} />
              <FormField label="Date of Submission" name="date_submission" type="date" value={form.date_submission} onChange={set} />

              {/* Partner Loan */}
              {isPartner && <>
                <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Partner Loan Details</div>
                <FormField label="Partner Loan Amount (₹)" name="partner_loan_amount" type="number" value={form.partner_loan_amount} onChange={set} />
                <FormField label="Partner Interest Rate (/100₹)" name="partner_interest_rate" type="number" value={form.partner_interest_rate} onChange={set} />
                <FormField label="Date of Keeping" name="date_keeping" type="date" value={form.date_keeping} onChange={set} />
                <FormField label="Kept On Amount (₹)" name="kept_amount" type="number" value={form.kept_amount} onChange={set} />
                <FormField label="SRK Interest" name="srk_interest" type="number" value={form.srk_interest} onChange={set} />
              </>}

              {form.id && <>
                <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Loan Closure</div>
                <FormField label="Loan Cleared Date" name="loan_cleared_date" type="date" value={form.loan_cleared_date} onChange={set} />
              </>}

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
