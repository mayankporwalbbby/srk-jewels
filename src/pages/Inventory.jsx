import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import FormField from '../components/FormField'
import { Plus, X, Upload, Image } from 'lucide-react'

const EMPTY = {
  sku_id: '', product_type: '', material: 'Gold', from_vendor: '',
  quantity: 1, weight_gm: '', quality_pct: '', fine: '',
  date_of_buying: '', metal_rate_buying: '', buying_rate_per_gram: '',
  product_cost: '', remarks: '',
  image_url: '', image_url_2: '', image_url_3: '', image_url_4: '', image_url_5: ''
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [imgFiles, setImgFiles] = useState([null, null, null, null, null])
  const [search, setSearch] = useState('')

  const set = (name, value) => {
    setForm(f => {
      const updated = { ...f, [name]: value }
      // Auto-calculations
      const weight = parseFloat(name === 'weight_gm' ? value : updated.weight_gm) || 0
      const qualityPct = parseFloat(name === 'quality_pct' ? value : updated.quality_pct) || 0
      const quality = qualityPct / 100
      const metalRate = parseFloat(name === 'metal_rate_buying' ? value : updated.metal_rate_buying) || 0
      const material = name === 'material' ? value : updated.material

      if (['weight_gm', 'quality_pct', 'metal_rate_buying', 'material'].includes(name)) {
        updated.fine = weight && quality ? (weight * quality).toFixed(4) : ''
        const ratePerGram = material === 'Gold' ? metalRate / 10 : metalRate / 1000
        updated.buying_rate_per_gram = metalRate ? ratePerGram.toFixed(2) : ''
        updated.product_cost = ratePerGram && weight && quality ? (ratePerGram * weight * quality).toFixed(2) : ''
      }
      return updated
    })
  }

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const uploadImg = async (file, sku, idx) => {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const path = `products/${sku || Date.now()}_${idx}.${ext}`
    const { error } = await supabase.storage.from('jewellery-images').upload(path, file, { upsert: true })
    if (error) return null
    return supabase.storage.from('jewellery-images').getPublicUrl(path).data.publicUrl
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const sku = form.sku_id || String(Date.now())
    const urls = await Promise.all(imgFiles.map((f, i) => uploadImg(f, sku, i + 1)))

    const payload = {
      ...form,
      quality: form.quality_pct ? parseFloat(form.quality_pct) / 100 : null,
      quantity: Number(form.quantity) || 1,
      weight_gm: parseFloat(form.weight_gm) || null,
      fine: parseFloat(form.fine) || null,
      product_cost: parseFloat(form.product_cost) || null,
      metal_rate_buying: parseFloat(form.metal_rate_buying) || null,
      buying_rate_per_gram: parseFloat(form.buying_rate_per_gram) || null,
      image_url: urls[0] || form.image_url || null,
      image_url_2: urls[1] || form.image_url_2 || null,
      image_url_3: urls[2] || form.image_url_3 || null,
      image_url_4: urls[3] || form.image_url_4 || null,
      image_url_5: urls[4] || form.image_url_5 || null,
    }
    delete payload.quality_pct

    if (form.id) await supabase.from('products').update(payload).eq('id', form.id)
    else await supabase.from('products').insert(payload)
    await load()
    setShowForm(false)
    setForm(EMPTY)
    setImgFiles([null, null, null, null, null])
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await supabase.from('products').delete().eq('id', id)
    await load()
  }

  const openEdit = (item) => {
    setForm({ ...item, quality_pct: item.quality ? (item.quality * 100).toFixed(0) : '' })
    setShowForm(true)
  }

  const allImages = (item) => [item.image_url, item.image_url_2, item.image_url_3, item.image_url_4, item.image_url_5].filter(Boolean)

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
        <button onClick={() => { setForm(EMPTY); setImgFiles([null,null,null,null,null]); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by SKU, type, or material..."
        className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400" />

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const imgs = allImages(item)
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                {imgs.length > 0 ? (
                  <div className="flex gap-1 mb-3 overflow-x-auto">
                    {imgs.map((url, i) => (
                      <img key={i} src={url} alt="" className="h-28 w-28 flex-shrink-0 object-cover rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="h-24 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                    <Image size={28} className="text-amber-200" />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-xs text-amber-600 font-semibold">{item.sku_id}</div>
                    <div className="font-semibold text-gray-800 mt-0.5">{item.product_type}</div>
                    <div className="text-sm text-gray-500">{item.material} · {item.weight_gm}g · {item.quality ? `${(item.quality * 100).toFixed(0)}%` : ''}</div>
                    {item.fine && <div className="text-xs text-gray-400">Fine: {item.fine}g</div>}
                    {item.product_cost && <div className="text-sm font-medium text-amber-700 mt-1">Cost: ₹{Number(item.product_cost).toLocaleString('en-IN')}</div>}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button onClick={() => openEdit(item)} className="text-xs text-blue-500 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 hover:underline">Del</button>
                  </div>
                </div>
                {item.remarks && <p className="text-xs text-gray-400 mt-2 italic">{item.remarks}</p>}
              </div>
            )
          })}
          {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-3">No items found.</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-800 mb-2">{form.id ? 'Edit' : 'Add'} Product</h2>
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-3">
              <span className="w-3 h-3 rounded-sm bg-amber-200 inline-block flex-shrink-0" /> Amber fields are auto-calculated but still editable.
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SKU ID <span className="text-red-500">*</span></label>
                <input required value={form.sku_id || ''} onChange={e => set('sku_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Type <span className="text-red-500">*</span></label>
                <input required value={form.product_type || ''} onChange={e => set('product_type', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <FormField label="Material" name="material" value={form.material} onChange={set} options={['Gold', 'Silver']} />
              <FormField label="From (Vendor)" name="from_vendor" value={form.from_vendor} onChange={set} />
              <FormField label="Quantity" name="quantity" type="number" value={form.quantity} onChange={set} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Weight (gm) <span className="text-red-500">*</span></label>
                <input required type="number" value={form.weight_gm || ''} onChange={e => set('weight_gm', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quality (%) <span className="text-red-500">*</span></label>
                <input required type="number" min="0" max="100" value={form.quality_pct || ''} onChange={e => set('quality_pct', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. 83" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fine Metal (gm) <span className="text-xs font-normal text-amber-600">auto</span></label>
                <input type="number" value={form.fine || ''} onChange={e => set('fine', e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <FormField label="Date of Buying" name="date_of_buying" type="date" value={form.date_of_buying} onChange={set} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Metal Rate on Buying {form.material === 'Gold' ? '(per 10g)' : '(per kg)'}</label>
                <input type="number" value={form.metal_rate_buying || ''} onChange={e => set('metal_rate_buying', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Buying Rate/Gram (₹) <span className="text-xs font-normal text-amber-600">auto</span></label>
                <input type="number" value={form.buying_rate_per_gram || ''} onChange={e => set('buying_rate_per_gram', e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Cost (₹) <span className="text-xs font-normal text-amber-600">auto</span></label>
                <input type="number" value={form.product_cost || ''} onChange={e => set('product_cost', e.target.value)}
                  className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <FormField label="Remarks" name="remarks" value={form.remarks} onChange={set} col2 rows={2} />

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-2">Product Photos (up to 5)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[0,1,2,3,4].map(i => (
                    <label key={i} className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-lg p-2 cursor-pointer hover:bg-amber-50 text-center">
                      {imgFiles[i] ? (
                        <img src={URL.createObjectURL(imgFiles[i])} className="h-12 w-full object-cover rounded" alt="" />
                      ) : form[i === 0 ? 'image_url' : `image_url_${i+1}`] ? (
                        <img src={form[i === 0 ? 'image_url' : `image_url_${i+1}`]} className="h-12 w-full object-cover rounded" alt="" />
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
