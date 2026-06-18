import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import FormField from '../components/FormField'
import { Plus, X, Upload, ChevronDown, ChevronUp } from 'lucide-react'

const EMPTY = {
  invoice_id: '', date: new Date().toISOString().split('T')[0],
  customer_name: '', address: '', contact: '', ref1: '', ref1_contact: '',
  ref2: '', ref2_contact: '', product_bought: '', product_details: '',
  product_metal: 'Silver', product_weight: '', product_quality: 1, fine_metal: '',
  product_stamp: '', metal_rate_on_day: '', metal_rate_per_gram: '',
  amount_without_gst: '', final_price_after_discount: '', hsn_code: '',
  gst_pct: 0.03, gst_amount: '', final_price_with_gst: '',
  amount_paid: '', pending_amount: '', bought_from: 'Self',
  product_amount: '', revenue: '', return_commitment: '', remark: ''
}

function SaleRow({ sale, onEdit }) {
  const [open, setOpen] = useState(false)
  const fmt = n => n != null ? '₹' + Number(n).toLocaleString('en-IN') : '—'

  return (
    <div className="border border-gray-100 rounded-xl bg-white mb-2 overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-50" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="font-mono text-xs text-amber-600 font-bold">{sale.invoice_id}</span>
            <span className="ml-2 text-sm text-gray-700 font-medium">{sale.customer_name}</span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">{sale.date}</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{sale.product_bought}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-800">{fmt(sale.final_price_with_gst)}</div>
            {sale.pending_amount > 0 && <div className="text-xs text-red-500">Pending: {fmt(sale.pending_amount)}</div>}
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Info label="Metal" value={`${sale.product_metal} · ${sale.product_weight}g`} />
          <Info label="Metal Rate/g" value={fmt(sale.metal_rate_per_gram)} />
          <Info label="Without GST" value={fmt(sale.amount_without_gst)} />
          <Info label="GST (3%)" value={fmt(sale.gst_amount)} />
          <Info label="Amount Paid" value={fmt(sale.amount_paid)} />
          <Info label="Pending" value={sale.pending_amount > 0 ? fmt(sale.pending_amount) : 'Cleared'} />
          <Info label="Bought From" value={sale.bought_from} />
          <Info label="Reference" value={sale.ref1 || '—'} />
          {sale.remark && <div className="col-span-2 md:col-span-4 text-xs text-gray-400 italic">{sale.remark}</div>}
          <div className="col-span-2 md:col-span-4 flex gap-4">
            {sale.image_front && <img src={sale.image_front} className="h-24 rounded-lg object-cover" alt="front" />}
            {sale.image_back && <img src={sale.image_back} className="h-24 rounded-lg object-cover" alt="back" />}
          </div>
          <div className="col-span-2 md:col-span-4">
            <button onClick={() => onEdit(sale)} className="text-xs text-blue-500 hover:underline">Edit this sale</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return <div><div className="text-xs text-gray-400">{label}</div><div className="font-medium text-gray-700">{value}</div></div>
}

export default function SalesLedger() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [imgFront, setImgFront] = useState(null)
  const [imgBack, setImgBack] = useState(null)
  const [search, setSearch] = useState('')

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }))

  const load = async () => {
    const { data } = await supabase.from('sales').select('*').order('date', { ascending: false })
    setSales(data || [])
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
    const [frontUrl, backUrl] = await Promise.all([uploadImg(imgFront, 'sales/front'), uploadImg(imgBack, 'sales/back')])
    const payload = {
      ...form,
      image_front: frontUrl || form.image_front,
      image_back: backUrl || form.image_back,
      product_weight: Number(form.product_weight) || null,
      metal_rate_on_day: Number(form.metal_rate_on_day) || null,
      metal_rate_per_gram: Number(form.metal_rate_per_gram) || null,
      amount_without_gst: Number(form.amount_without_gst) || null,
      final_price_after_discount: Number(form.final_price_after_discount) || null,
      gst_pct: Number(form.gst_pct) || 0.03,
      gst_amount: Number(form.gst_amount) || null,
      final_price_with_gst: Number(form.final_price_with_gst) || null,
      amount_paid: Number(form.amount_paid) || null,
      pending_amount: Number(form.pending_amount) || null,
      product_amount: Number(form.product_amount) || null,
      revenue: Number(form.revenue) || null,
    }
    if (form.id) await supabase.from('sales').update(payload).eq('id', form.id)
    else await supabase.from('sales').insert(payload)
    await load()
    setShowForm(false)
    setForm(EMPTY)
    setSaving(false)
  }

  const filtered = sales.filter(s => !search || [s.invoice_id, s.customer_name, s.product_bought].some(v => v?.toLowerCase().includes(search.toLowerCase())))
  const totalPending = sales.reduce((a, s) => a + (s.pending_amount || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Ledger</h1>
          <p className="text-gray-500 text-sm">{sales.length} sales · Pending: ₹{Number(totalPending).toLocaleString('en-IN')}</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus size={16} /> New Sale
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice, customer, product..."
        className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400" />

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        filtered.length === 0 ? <p className="text-gray-400 text-sm">No sales found.</p> :
          filtered.map(s => <SaleRow key={s.id} sale={s} onEdit={s => { setForm(s); setShowForm(true) }} />)
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{form.id ? 'Edit' : 'Record'} Sale</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <FormField label="Invoice ID" name="invoice_id" value={form.invoice_id} onChange={set} />
              <FormField label="Date" name="date" type="date" value={form.date} onChange={set} />
              <FormField label="Customer Name" name="customer_name" value={form.customer_name} onChange={set} col2 />
              <FormField label="Address" name="address" value={form.address} onChange={set} col2 />
              <FormField label="Contact" name="contact" type="tel" value={form.contact} onChange={set} />
              <FormField label="Return Commitment" name="return_commitment" value={form.return_commitment} onChange={set} />
              <FormField label="Reference 1" name="ref1" value={form.ref1} onChange={set} />
              <FormField label="Ref 1 Contact" name="ref1_contact" type="tel" value={form.ref1_contact} onChange={set} />
              <FormField label="Reference 2" name="ref2" value={form.ref2} onChange={set} />
              <FormField label="Ref 2 Contact" name="ref2_contact" type="tel" value={form.ref2_contact} onChange={set} />

              <div className="col-span-2 border-t pt-3 mt-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Details</div>
              <FormField label="Product Bought" name="product_bought" value={form.product_bought} onChange={set} />
              <FormField label="Product Details" name="product_details" value={form.product_details} onChange={set} />
              <FormField label="Metal" name="product_metal" value={form.product_metal} onChange={set} options={['Gold', 'Silver']} />
              <FormField label="Weight (gm)" name="product_weight" type="number" value={form.product_weight} onChange={set} />
              <FormField label="Quality" name="product_quality" type="number" value={form.product_quality} onChange={set} />
              <FormField label="Fine Metal" name="fine_metal" type="number" value={form.fine_metal} onChange={set} />
              <FormField label="Metal Rate on Day" name="metal_rate_on_day" type="number" value={form.metal_rate_on_day} onChange={set} />
              <FormField label="Metal Rate/Gram" name="metal_rate_per_gram" type="number" value={form.metal_rate_per_gram} onChange={set} />
              <FormField label="HSN Code" name="hsn_code" value={form.hsn_code} onChange={set} />
              <FormField label="Bought From" name="bought_from" value={form.bought_from} onChange={set} options={['Self', 'Alam', 'SKP', 'Other']} />

              <div className="col-span-2 border-t pt-3 mt-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pricing</div>
              <FormField label="Amount without GST (₹)" name="amount_without_gst" type="number" value={form.amount_without_gst} onChange={set} />
              <FormField label="Final after Discount (₹)" name="final_price_after_discount" type="number" value={form.final_price_after_discount} onChange={set} />
              <FormField label="GST %" name="gst_pct" type="number" value={form.gst_pct} onChange={set} />
              <FormField label="GST Amount (₹)" name="gst_amount" type="number" value={form.gst_amount} onChange={set} />
              <FormField label="Final Price with GST (₹)" name="final_price_with_gst" type="number" value={form.final_price_with_gst} onChange={set} />
              <FormField label="Amount Paid (₹)" name="amount_paid" type="number" value={form.amount_paid} onChange={set} />
              <FormField label="Pending Amount (₹)" name="pending_amount" type="number" value={form.pending_amount} onChange={set} />
              <FormField label="Product Cost (₹)" name="product_amount" type="number" value={form.product_amount} onChange={set} />
              <FormField label="Revenue / Profit (₹)" name="revenue" type="number" value={form.revenue} onChange={set} />
              <FormField label="Remarks" name="remark" value={form.remark} onChange={set} col2 rows={2} />

              <div className="col-span-2 grid grid-cols-2 gap-3">
                {[['Front Image', imgFront, setImgFront], ['Back Image', imgBack, setImgBack]].map(([lbl, file, setter]) => (
                  <div key={lbl}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{lbl}</label>
                    <label className="flex items-center gap-2 border-2 border-dashed border-amber-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-xs text-amber-600">
                      <Upload size={14} /> {file ? file.name : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => setter(e.target.files[0])} />
                    </label>
                  </div>
                ))}
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
