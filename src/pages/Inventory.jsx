import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import FormField from '../components/FormField'
import { Plus, X, Upload } from 'lucide-react'

const EMPTY = {
  sku_id: '', product_type: '', material: 'Gold', from_vendor: '',
  quantity: 1, weight_gm: '', quality: '', fine: '',
  date_of_buying: '', metal_rate_buying: '', buying_rate_per_gram: '',
  product_cost: '', remarks: ''
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [imgFile, setImgFile] = useState(null)
  const [search, setSearch] = useState('')

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }))

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    let image_url = form.image_url || null

    if (imgFile) {
      const ext = imgFile.name.split('.').pop()
      const path = `products/${form.sku_id || Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('jewellery-images').upload(path, imgFile, { upsert: true })
      if (!upErr) {
        image_url = supabase.storage.from('jewellery-images').getPublicUrl(path).data.publicUrl
      }
    }

    const payload = {
      ...form, image_url,
      quantity: Number(form.quantity) || 1,
      weight_gm: Number(form.weight_gm) || null,
      product_cost: Number(form.product_cost) || null,
      metal_rate_buying: Number(form.metal_rate_buying) || null,
      buying_rate_per_gram: Number(form.buying_rate_per_gram) || null,
    }

    if (form.id) await supabase.from('products').update(payload).eq('id', form.id)
    else await supabase.from('products').insert(payload)
    await load()
    setShowForm(false)
    setForm(EMPTY)
    setImgFile(null)
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await supabase.from('products').delete().eq('id', id)
    await load()
  }

  const filtered = items.filter(i =>
    !search || [i.sku_id, i.product_type, i.material].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-gray-500 text-sm">{items.length} items in stock</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by SKU, type, or material..."
        className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400" />

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {item.image_url && <img src={item.image_url} alt={item.product_type} className="w-full h-36 object-cover rounded-lg mb-3" />}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs text-amber-600 font-semibold">{item.sku_id}</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{item.product_type}</div>
                  <div className="text-sm text-gray-500">{item.material} · {item.weight_gm}g · {item.quality ? `${(Number(item.quality) * 100).toFixed(0)}%` : ''}</div>
                  {item.product_cost && <div className="text-sm font-medium text-amber-700 mt-1">Cost: ₹{Number(item.product_cost).toLocaleString('en-IN')}</div>}
                </div>
                <div className="flex gap-2 ml-2">
                  <button onClick={() => { setForm(item); setShowForm(true) }} className="text-xs text-blue-500 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 hover:underline">Del</button>
                </div>
              </div>
              {item.remarks && <p className="text-xs text-gray-400 mt-2 italic">{item.remarks}</p>}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-3">No items found.</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{form.id ? 'Edit' : 'Add'} Product</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <FormField label="SKU ID" name="sku_id" value={form.sku_id} onChange={set} required />
              <FormField label="Product Type" name="product_type" value={form.product_type} onChange={set} required />
              <FormField label="Material" name="material" value={form.material} onChange={set} options={['Gold', 'Silver']} />
              <FormField label="From (Vendor)" name="from_vendor" value={form.from_vendor} onChange={set} />
              <FormField label="Quantity" name="quantity" type="number" value={form.quantity} onChange={set} />
              <FormField label="Weight (gm)" name="weight_gm" type="number" value={form.weight_gm} onChange={set} />
              <FormField label="Quality (e.g. 0.83)" name="quality" type="number" value={form.quality} onChange={set} />
              <FormField label="Fine" name="fine" type="number" value={form.fine} onChange={set} />
              <FormField label="Date of Buying" name="date_of_buying" type="date" value={form.date_of_buying} onChange={set} />
              <FormField label="Metal Rate on Buying" name="metal_rate_buying" type="number" value={form.metal_rate_buying} onChange={set} />
              <FormField label="Buying Rate/Gram" name="buying_rate_per_gram" type="number" value={form.buying_rate_per_gram} onChange={set} />
              <FormField label="Product Cost (₹)" name="product_cost" type="number" value={form.product_cost} onChange={set} />
              <FormField label="Remarks" name="remarks" value={form.remarks} onChange={set} col2 rows={2} />
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Photo</label>
                <label className="flex items-center gap-2 border-2 border-dashed border-amber-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-amber-50 text-sm text-amber-600">
                  <Upload size={16} />
                  {imgFile ? imgFile.name : 'Click to upload image'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => setImgFile(e.target.files[0])} />
                </label>
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
