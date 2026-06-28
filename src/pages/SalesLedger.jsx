import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import FormField from '../components/FormField'
import { useMetalPrices } from '../hooks/useMetalPrices'
import { Plus, X, Upload, ChevronDown, ChevronUp, Phone, MessageCircle, Printer } from 'lucide-react'

const EMPTY = {
  invoice_id: '', date: new Date().toISOString().split('T')[0],
  customer_name: '', address: '', contact: '', ref1: '', ref1_contact: '',
  ref2: '', ref2_contact: '', product_bought: '', product_details: '',
  product_metal: 'Gold', product_weight: '', product_quality_pct: '', fine_metal: '',
  product_stamp: '', metal_rate_on_day: '', metal_rate_per_gram: '',
  gst_pct: 3, discount: 0,
  amount_without_gst: '', gst_amount: '', final_price_with_gst: '',
  final_price_after_discount: '', hsn_code: '', bought_from: 'Self',
  amount_paid: '', pending_amount: '', product_amount: '', revenue: '',
  return_commitment: '', payment_commitment: '', executive: 'Mayank', remark: '',
  gold_rate_at_sale: '',
  image_url: '', image_url_2: '', image_url_3: '', image_url_4: '', image_url_5: ''
}

const EXECUTIVES = ['Mayank', 'Divyanshu']

function PrintInvoice({ sale, onClose }) {
  const withGST = sale.final_price_with_gst
  const withoutGST = sale.final_price_after_discount || sale.amount_without_gst
  const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Print Invoice</h2>
        <div id="invoice-content" className="border border-gray-200 rounded-lg p-4 text-sm mb-4">
          <div className="text-center mb-3 border-b pb-3">
            <div className="font-bold text-lg text-amber-800">Shri Ram Krishna Jewellers</div>
            <div className="text-xs text-gray-500">Invoice</div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs mb-3">
            <div><span className="text-gray-500">Invoice:</span> <strong>{sale.invoice_id}</strong></div>
            <div><span className="text-gray-500">Date:</span> {sale.date}</div>
            <div><span className="text-gray-500">Customer:</span> {sale.customer_name}</div>
            <div><span className="text-gray-500">Contact:</span> {sale.contact}</div>
            <div className="col-span-2"><span className="text-gray-500">Address:</span> {sale.address}</div>
          </div>
          <table className="w-full text-xs border-t pt-2 mb-3">
            <thead><tr className="text-gray-500 border-b"><th className="text-left py-1">Item</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              <tr><td>{sale.product_bought} ({sale.product_metal}, {sale.product_weight}g)</td><td className="text-right">{fmt(sale.amount_without_gst)}</td></tr>
              {sale.discount > 0 && <tr><td className="text-green-600">Discount</td><td className="text-right text-green-600">-{fmt(sale.discount)}</td></tr>}
              <tr><td>GST ({sale.gst_pct}%)</td><td className="text-right">{fmt(sale.gst_amount)}</td></tr>
              <tr className="border-t font-bold"><td>Total</td><td className="text-right">{fmt(sale.final_price_with_gst)}</td></tr>
              <tr><td className="text-gray-500">Amount Paid</td><td className="text-right">{fmt(sale.amount_paid)}</td></tr>
              {sale.pending_amount > 0 && <tr className="text-red-500"><td>Pending</td><td className="text-right">{fmt(sale.pending_amount)}</td></tr>}
            </tbody>
          </table>
          {sale.return_commitment && <div className="text-xs text-gray-500 border-t pt-2">Return Commitment: {sale.return_commitment}</div>}
          <div className="text-xs text-gray-400 mt-2 text-center">HSN: {sale.hsn_code} | Thank you for your purchase!</div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { window.print() }} className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white py-2 rounded-lg text-sm font-semibold">
            <Printer size={14} /> Print with GST ({fmt(withGST)})
          </button>
          <button onClick={() => { window.print() }} className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-white py-2 rounded-lg text-sm font-semibold">
            <Printer size={14} /> Without GST ({fmt(withoutGST)})
          </button>
        </div>
      </div>
    </div>
  )
}

function SaleRow({ sale, onEdit, onPrint }) {
  const [open, setOpen] = useState(false)
  const [payments, setPayments] = useState([])
  const [newAmt, setNewAmt] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newNote, setNewNote] = useState('')
  const [addingPay, setAddingPay] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—'

  const loadPayments = async () => {
    const { data } = await supabase.from('sale_payments').select('*').eq('sale_id', sale.id).order('date')
    setPayments(data || [])
  }

  const handleOpen = () => {
    if (!open) loadPayments()
    setOpen(o => !o)
  }

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0) + (sale.amount_paid || 0)
  const totalPending = (sale.final_price_with_gst || 0) - totalPaid

  const addPayment = async () => {
    if (!newAmt) return
    await supabase.from('sale_payments').insert({ sale_id: sale.id, amount: parseFloat(newAmt), date: newDate, note: newNote || null })
    setNewAmt(''); setNewNote(''); setAddingPay(false)
    loadPayments()
  }

  const deletePayment = async (id) => {
    if (!confirm('Delete this payment entry?')) return
    await supabase.from('sale_payments').delete().eq('id', id)
    loadPayments()
  }

  return (
    <>
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-h-full max-w-full rounded-xl" alt="Preview" />
        </div>
      )}
      <div className="border border-gray-100 rounded-xl bg-white mb-2 overflow-hidden">
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50" onClick={handleOpen}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-amber-600 font-bold">{sale.invoice_id}</span>
            <span className="text-sm text-gray-700 font-medium">{sale.customer_name}</span>
            <span className="text-xs text-gray-400 hidden sm:block">{sale.date}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{sale.product_bought}</span>
            {sale.executive && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{sale.executive}</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold">{fmt(sale.final_price_with_gst)}</div>
              {totalPending > 0
                ? <div className="text-xs text-red-500">Pending: {fmt(totalPending)}</div>
                : <div className="text-xs text-green-500">Cleared</div>}
            </div>
            {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </div>

        {open && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
            {/* Images */}
            {(() => {
              const imgs = [sale.image_url || sale.image_front, sale.image_url_2 || sale.image_back, sale.image_url_3, sale.image_url_4, sale.image_url_5].filter(Boolean)
              return imgs.length > 0 ? (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Photos · {sale.date}</div>
                  <div className="flex gap-2 flex-wrap">
                    {imgs.map((url, i) => (
                      <div key={i} className="relative cursor-pointer" onClick={() => setLightbox(url)}>
                        <img src={url} className="h-20 w-20 object-cover rounded-lg border border-gray-200" alt={`Photo ${i+1}`} />
                        <span className="absolute bottom-0 left-0 right-0 text-center text-white text-xs bg-black/40 rounded-b-lg py-0.5">Photo {i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            {/* Sale details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info label="Metal" value={`${sale.product_metal} · ${sale.product_weight}g`} />
              <Info label="Quality" value={sale.product_quality_pct ? `${sale.product_quality_pct}%` : '—'} />
              <Info label="Rate/Gram" value={fmt(sale.metal_rate_per_gram)} />
              <Info label="Without GST" value={fmt(sale.amount_without_gst)} />
              <Info label="Discount" value={sale.discount > 0 ? fmt(sale.discount) : 'None'} />
              <Info label="GST" value={fmt(sale.gst_amount)} />
              {sale.payment_commitment && <Info label="Payment Commitment" value={sale.payment_commitment} />}
              {sale.return_commitment && <Info label="Return Commitment" value={sale.return_commitment} />}
              {sale.contact && (
                <div className="col-span-2 flex gap-3 mt-1">
                  <a href={`tel:${sale.contact}`} className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><Phone size={12} /> Call</a>
                  <a href={`https://wa.me/91${sale.contact?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-500 hover:underline"><MessageCircle size={12} /> WhatsApp</a>
                </div>
              )}
            </div>

            {/* Payment ledger */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Ledger</div>
                <button onClick={() => setAddingPay(p => !p)} className="text-xs text-amber-600 font-medium hover:underline">+ Add Payment</button>
              </div>

              {/* Original payment row */}
              {sale.amount_paid > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{fmt(sale.amount_paid)}</span>
                    <span className="text-xs text-gray-400 ml-2">{sale.date} · Initial payment</span>
                  </div>
                </div>
              )}

              {/* Additional payments */}
              {payments.map(p => (
                <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-gray-200 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{fmt(p.amount)}</span>
                    <span className="text-xs text-gray-400 ml-2">{p.date}{p.note ? ` · ${p.note}` : ''}</span>
                  </div>
                  <button onClick={() => deletePayment(p.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                </div>
              ))}

              {/* Totals */}
              <div className="flex justify-between pt-2 text-sm font-semibold mt-1">
                <span className="text-gray-600">Total Paid</span>
                <span className="text-green-600">{fmt(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-600">Pending</span>
                <span className={totalPending > 0 ? 'text-red-500' : 'text-green-500'}>{totalPending > 0 ? fmt(totalPending) : 'Cleared ✓'}</span>
              </div>

              {/* Add payment form */}
              {addingPay && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <input type="number" placeholder="Amount ₹" value={newAmt} onChange={e => setNewAmt(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <input placeholder="Note (optional)" value={newNote} onChange={e => setNewNote(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <button onClick={addPayment} className="col-span-3 bg-amber-600 text-white text-sm py-1.5 rounded-lg font-medium hover:bg-amber-700">Save Payment</button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => onEdit(sale)} className="text-xs text-blue-500 hover:underline">Edit</button>
              <button onClick={() => onPrint(sale)} className="text-xs text-gray-500 hover:underline flex items-center gap-1"><Printer size={10} /> Print Invoice</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Info({ label, value }) {
  return <div><div className="text-xs text-gray-400">{label}</div><div className="font-medium text-gray-700">{value}</div></div>
}

export default function SalesLedger() {
  const [sales, setSales] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [imgFiles, setImgFiles] = useState([null, null, null, null, null])
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('all')
  const [printSale, setPrintSale] = useState(null)
  const [custSearch, setCustSearch] = useState('')
  const [showCustDropdown, setShowCustDropdown] = useState(false)
  const { gold10g } = useMetalPrices()

  const set = (name, value) => {
    setForm(f => {
      const updated = { ...f, [name]: value }
      const weight = parseFloat(name === 'product_weight' ? value : updated.product_weight) || 0
      const qualityPct = parseFloat(name === 'product_quality_pct' ? value : updated.product_quality_pct) || 0
      const quality = qualityPct / 100
      const metalRate = parseFloat(name === 'metal_rate_on_day' ? value : updated.metal_rate_on_day) || 0
      const metal = name === 'product_metal' ? value : updated.product_metal
      const gstPct = parseFloat(name === 'gst_pct' ? value : updated.gst_pct) || 0
      const discount = parseFloat(name === 'discount' ? value : updated.discount) || 0
      const amountPaid = parseFloat(name === 'amount_paid' ? value : updated.amount_paid) || 0

      if (['product_weight', 'product_quality_pct', 'metal_rate_on_day', 'product_metal', 'gst_pct', 'discount', 'amount_paid'].includes(name)) {
        const ratePerGram = metal === 'Gold' ? metalRate / 10 : metalRate / 1000
        updated.metal_rate_per_gram = metalRate ? ratePerGram.toFixed(2) : ''
        updated.fine_metal = weight && quality ? (weight * quality).toFixed(4) : ''
        const amtWithoutGST = ratePerGram * weight * quality
        updated.amount_without_gst = amtWithoutGST ? amtWithoutGST.toFixed(2) : ''
        const afterDiscount = amtWithoutGST - discount
        updated.final_price_after_discount = afterDiscount ? afterDiscount.toFixed(2) : ''
        const gstAmt = afterDiscount * (gstPct / 100)
        updated.gst_amount = gstAmt ? gstAmt.toFixed(2) : ''
        const finalWithGST = afterDiscount + gstAmt
        updated.final_price_with_gst = finalWithGST ? finalWithGST.toFixed(2) : ''
        updated.pending_amount = finalWithGST ? Math.max(0, finalWithGST - amountPaid).toFixed(2) : ''
      }
      return updated
    })
  }

  const selectCustomer = (c) => {
    setForm(f => ({ ...f, customer_name: c.name, address: c.address || '', contact: c.contact || '', ref1: c.ref1 || '', ref1_contact: c.ref1_contact || '', ref2: c.ref2 || '', ref2_contact: c.ref2_contact || '' }))
    setCustSearch(c.name)
    setShowCustDropdown(false)
  }

  const load = async () => {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('customers').select('*').order('name')
    ])
    setSales(s || [])
    setCustomers(c || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const uploadImg = async (file, folder) => {
    if (!file) return null
    const path = `${folder}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('jewellery-images').upload(path, file, { upsert: true })
    if (error) return null
    return supabase.storage.from('jewellery-images').getPublicUrl(path).data.publicUrl
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const urls = await Promise.all(imgFiles.map((f, i) => f ? uploadImg(f, `sales/${i+1}`) : Promise.resolve(null)))
    const payload = {
      ...form,
      image_url: urls[0] || form.image_url || form.image_front || null,
      image_url_2: urls[1] || form.image_url_2 || form.image_back || null,
      image_url_3: urls[2] || form.image_url_3 || null,
      image_url_4: urls[3] || form.image_url_4 || null,
      image_url_5: urls[4] || form.image_url_5 || null,
      product_quality_pct: parseFloat(form.product_quality_pct) || null,
      product_weight: parseFloat(form.product_weight) || null,
      metal_rate_on_day: parseFloat(form.metal_rate_on_day) || null,
      metal_rate_per_gram: parseFloat(form.metal_rate_per_gram) || null,
      amount_without_gst: parseFloat(form.amount_without_gst) || null,
      final_price_after_discount: parseFloat(form.final_price_after_discount) || null,
      gst_pct: parseFloat(form.gst_pct) || 3,
      gst_amount: parseFloat(form.gst_amount) || null,
      final_price_with_gst: parseFloat(form.final_price_with_gst) || null,
      amount_paid: parseFloat(form.amount_paid) || null,
      pending_amount: parseFloat(form.pending_amount) || null,
      discount: parseFloat(form.discount) || 0,
      product_amount: parseFloat(form.product_amount) || null,
      revenue: parseFloat(form.revenue) || null,
      fine_metal: parseFloat(form.fine_metal) || null,
      gold_rate_at_sale: parseFloat(form.gold_rate_at_sale) || null,
    }
    delete payload.product_quality_pct
    delete payload.image_front
    delete payload.image_back

    let error
    if (form.id) {
      const result = await supabase.from('sales').update(payload).eq('id', form.id)
      error = result.error
    } else {
      const result = await supabase.from('sales').insert(payload)
      error = result.error
    }

    if (error) {
      alert('Error saving sale: ' + error.message)
      setSaving(false)
      return
    }

    await load()
    setShowForm(false)
    setForm(EMPTY)
    setImgFiles([null, null, null, null, null])
    setSaving(false)
  }

  const filterByPeriod = (list) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (period === 'today') return list.filter(s => s.date === today)
    if (period === 'week') {
      const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0]
      return list.filter(s => s.date >= weekAgo)
    }
    if (period === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      return list.filter(s => s.date >= monthAgo)
    }
    if (period === 'year') {
      const yearStart = `${now.getFullYear()}-01-01`
      return list.filter(s => s.date >= yearStart)
    }
    return list
  }

  const filtered = filterByPeriod(sales.filter(s =>
    !search || [s.invoice_id, s.customer_name, s.product_bought].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  ))
  const totalPending = filtered.reduce((a, s) => a + (s.pending_amount || 0), 0)
  const totalSales = filtered.reduce((a, s) => a + (s.final_price_with_gst || 0), 0)

  const filtCusts = customers.filter(c => c.name?.toLowerCase().includes(custSearch.toLowerCase()))

  return (
    <div>
      {printSale && <PrintInvoice sale={printSale} onClose={() => setPrintSale(null)} />}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Ledger</h1>
          <p className="text-gray-500 text-sm">Total: ₹{Number(totalSales).toLocaleString('en-IN')} · Pending: ₹{Number(totalPending).toLocaleString('en-IN')}</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY, gold_rate_at_sale: gold10g || '', metal_rate_on_day: gold10g || '' }); setCustSearch(''); setImgFiles([null,null,null,null,null]); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus size={16} /> New Sale
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'today', 'week', 'month', 'year'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize ${period === p ? 'bg-amber-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
            {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'Today'}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 flex-1 min-w-36" />
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        filtered.length === 0 ? <p className="text-gray-400 text-sm">No sales found.</p> :
          filtered.map(s => <SaleRow key={s.id} sale={s} onEdit={s => { setForm({ ...s, product_quality_pct: s.product_quality_pct || '' }); setCustSearch(s.customer_name || ''); setImgFiles([null,null,null,null,null]); setShowForm(true) }} onPrint={setPrintSale} />)
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-800 mb-2">{form.id ? 'Edit' : 'Record'} Sale</h2>
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-3">
              <span className="w-3 h-3 rounded-sm bg-amber-200 inline-block flex-shrink-0" /> Amber fields are auto-calculated but still editable.
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Invoice ID <span className="text-red-500">*</span></label>
                <input required value={form.invoice_id || ''} onChange={e => set('invoice_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
                <input required type="date" value={form.date || ''} onChange={e => set('date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <FormField label="Executive" name="executive" value={form.executive} onChange={set} options={EXECUTIVES} />
              <div />

              {/* Customer auto-populate */}
              <div className="col-span-2 relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name <span className="text-red-500">*</span> <span className="font-normal text-gray-400">(type to search)</span></label>
                <input value={custSearch} onChange={e => { setCustSearch(e.target.value); set('customer_name', e.target.value); setShowCustDropdown(true) }}
                  onFocus={() => setShowCustDropdown(true)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Type customer name..." />
                {showCustDropdown && filtCusts.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {filtCusts.map(c => (
                      <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 border-b last:border-0">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.contact} · {c.address}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <FormField label="Address" name="address" value={form.address} onChange={set} col2 />
              <FormField label="Contact" name="contact" type="tel" value={form.contact} onChange={set} />
              <div />
              <FormField label="Reference 1" name="ref1" value={form.ref1} onChange={set} />
              <FormField label="Ref 1 Contact" name="ref1_contact" type="tel" value={form.ref1_contact} onChange={set} />
              <FormField label="Reference 2" name="ref2" value={form.ref2} onChange={set} />
              <FormField label="Ref 2 Contact" name="ref2_contact" type="tel" value={form.ref2_contact} onChange={set} />

              <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Details</div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Bought <span className="text-red-500">*</span></label>
                <input required value={form.product_bought || ''} onChange={e => set('product_bought', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <FormField label="Product Details" name="product_details" value={form.product_details} onChange={set} />
              <FormField label="Metal" name="product_metal" value={form.product_metal} onChange={set} options={['Gold', 'Silver']} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Weight (gm) <span className="text-red-500">*</span></label>
                <input required type="number" value={form.product_weight || ''} onChange={e => set('product_weight', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quality (%) <span className="text-red-500">*</span></label>
                <input required type="number" min="0" max="100" value={form.product_quality_pct || ''} onChange={e => set('product_quality_pct', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. 83" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fine Metal (gm) <span className="text-xs font-normal text-amber-600">auto</span></label>
                <input type="number" value={form.fine_metal || ''} onChange={e => set('fine_metal', e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Metal Rate on Day <span className="text-red-500">*</span> {form.product_metal === 'Gold' ? '(per 10g)' : '(per kg)'}</label>
                <input required type="number" value={form.metal_rate_on_day || ''} onChange={e => set('metal_rate_on_day', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Metal Rate/Gram (₹) <span className="text-xs font-normal text-amber-600">auto</span></label>
                <input type="number" value={form.metal_rate_per_gram || ''} onChange={e => set('metal_rate_per_gram', e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <FormField label="HSN Code" name="hsn_code" value={form.hsn_code} onChange={set} />
              <FormField label="Bought From" name="bought_from" value={form.bought_from} onChange={set} options={['Self', 'Alam', 'SKP', 'Other']} />
              <FormField label="Return Commitment" name="return_commitment" value={form.return_commitment} onChange={set} />
              <FormField label="Product Stamp" name="product_stamp" value={form.product_stamp} onChange={set} />

              <div className="col-span-2 border-t pt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pricing</div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gold Rate on Sale Day (₹/10g) <span className="text-xs font-normal text-amber-600">auto</span></label>
                <input type="number" value={form.gold_rate_at_sale || ''} onChange={e => set('gold_rate_at_sale', e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GST %</label>
                <input type="number" value={form.gst_pct || ''} onChange={e => set('gst_pct', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Discount (₹)</label>
                <input type="number" value={form.discount || ''} onChange={e => set('discount', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="0" />
              </div>
              {[['Amount without GST (₹)', 'amount_without_gst'], ['After Discount (₹)', 'final_price_after_discount'], ['GST Amount (₹)', 'gst_amount'], ['Final with GST (₹)', 'final_price_with_gst']].map(([lbl, key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{lbl} <span className="text-xs font-normal text-amber-600">auto</span></label>
                  <input type="number" value={form[key] || ''} onChange={e => set(key, e.target.value)}
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid (₹)</label>
                <input type="number" value={form.amount_paid || ''} onChange={e => set('amount_paid', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pending Amount (₹) <span className="text-xs font-normal text-amber-600">auto</span></label>
                <input type="number" value={form.pending_amount || ''} onChange={e => set('pending_amount', e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <FormField label="Payment Commitment" name="payment_commitment" value={form.payment_commitment} onChange={set} col2 />
              <FormField label="Product Cost (₹)" name="product_amount" type="number" value={form.product_amount} onChange={set} />
              <FormField label="Revenue/Profit (₹)" name="revenue" type="number" value={form.revenue} onChange={set} />
              <FormField label="Remarks" name="remark" value={form.remark} onChange={set} col2 rows={2} />

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-2">Product Photos (up to 5)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[0,1,2,3,4].map(i => (
                    <label key={i} className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-lg p-2 cursor-pointer hover:bg-amber-50 text-center">
                      {imgFiles[i] ? (
                        <img src={URL.createObjectURL(imgFiles[i])} className="h-12 w-full object-cover rounded" alt="" />
                      ) : form[i === 0 ? 'image_url' : `image_url_${i+1}`] || (i === 0 ? form.image_front : i === 1 ? form.image_back : null) ? (
                        <img src={form[i === 0 ? 'image_url' : `image_url_${i+1}`] || (i === 0 ? form.image_front : form.image_back)} className="h-12 w-full object-cover rounded" alt="" />
                      ) : (
                        <><Upload size={14} className="text-amber-400 mb-1" /><span className="text-xs text-amber-500">Photo {i+1}</span></>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const files = [...imgFiles]; files[i] = e.target.files[0]; setImgFiles(files)
                      }} />
                    </label>
                  ))}
                </div>
              </div>

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
