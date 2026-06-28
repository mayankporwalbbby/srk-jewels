import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import FormField from '../components/FormField'
import { Plus, X, User, Phone, MessageCircle } from 'lucide-react'

const EMPTY = { name: '', contact: '', alt_contact: '', email: '', address: '', aadhar: '', ref1: '', ref1_contact: '', ref2: '', ref2_contact: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }))

  const load = async () => {
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    if (form.id) await supabase.from('customers').update(form).eq('id', form.id)
    else await supabase.from('customers').insert(form)
    await load()
    setShowForm(false)
    setForm(EMPTY)
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return
    await supabase.from('customers').delete().eq('id', id)
    await load()
  }

  const filtered = customers.filter(c => !search || [c.name, c.contact, c.address].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  const waLink = (contact) => `https://wa.me/91${contact?.replace(/\D/g, '')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customer Book</h1>
          <p className="text-gray-500 text-sm">{customers.length} customers</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, contact, address..."
        className="w-full md:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400" />

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{c.name}</div>
                    {c.address && <div className="text-xs text-gray-500 mt-0.5">{c.address}</div>}
                    {c.aadhar && <div className="text-xs text-gray-400 mt-0.5">Aadhar: {c.aadhar}</div>}

                    {/* Primary contact */}
                    {c.contact && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-600">{c.contact}</span>
                        <a href={`tel:${c.contact}`} className="p-1 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100">
                          <Phone size={12} />
                        </a>
                        <a href={waLink(c.contact)} target="_blank" rel="noreferrer" className="p-1 rounded-full bg-green-50 text-green-500 hover:bg-green-100">
                          <MessageCircle size={12} />
                        </a>
                      </div>
                    )}
                    {c.alt_contact && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{c.alt_contact}</span>
                        <a href={`tel:${c.alt_contact}`} className="p-1 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100">
                          <Phone size={11} />
                        </a>
                        <a href={waLink(c.alt_contact)} target="_blank" rel="noreferrer" className="p-1 rounded-full bg-green-50 text-green-500 hover:bg-green-100">
                          <MessageCircle size={11} />
                        </a>
                      </div>
                    )}

                    {(c.ref1 || c.ref2) && (
                      <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                        {c.ref1 && (
                          <div className="flex items-center gap-2">
                            <span>Ref: {c.ref1} {c.ref1_contact && `· ${c.ref1_contact}`}</span>
                            {c.ref1_contact && <a href={waLink(c.ref1_contact)} target="_blank" rel="noreferrer" className="text-green-400 hover:text-green-600"><MessageCircle size={10} /></a>}
                          </div>
                        )}
                        {c.ref2 && (
                          <div className="flex items-center gap-2">
                            <span>Ref: {c.ref2} {c.ref2_contact && `· ${c.ref2_contact}`}</span>
                            {c.ref2_contact && <a href={waLink(c.ref2_contact)} target="_blank" rel="noreferrer" className="text-green-400 hover:text-green-600"><MessageCircle size={10} /></a>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-2 flex-shrink-0">
                  <button onClick={() => { setForm(c); setShowForm(true) }} className="text-xs text-blue-500 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:underline">Del</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-3">No customers found.</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{form.id ? 'Edit' : 'Add'} Customer</h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
              <FormField label="Full Name" name="name" value={form.name} onChange={set} />
              <FormField label="Contact Number" name="contact" type="tel" value={form.contact} onChange={set} />
              <FormField label="Alt. Contact" name="alt_contact" type="tel" value={form.alt_contact} onChange={set} />
              <FormField label="Email" name="email" type="email" value={form.email} onChange={set} />
              <FormField label="Full Address" name="address" value={form.address} onChange={set} col2 rows={2} />
              <FormField label="Aadhar Number" name="aadhar" value={form.aadhar} onChange={set} />
              <div />
              <FormField label="Reference 1 Name" name="ref1" value={form.ref1} onChange={set} />
              <FormField label="Ref 1 Contact" name="ref1_contact" type="tel" value={form.ref1_contact} onChange={set} />
              <FormField label="Reference 2 Name" name="ref2" value={form.ref2} onChange={set} />
              <FormField label="Ref 2 Contact" name="ref2_contact" type="tel" value={form.ref2_contact} onChange={set} />
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
