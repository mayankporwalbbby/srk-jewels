export default function FormField({ label, name, type = 'text', value, onChange, options, rows, col2, required }) {
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
  return (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>
      {options ? (
        <select value={value || ''} onChange={e => onChange(name, e.target.value)} className={cls}>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : rows ? (
        <textarea rows={rows} value={value || ''} onChange={e => onChange(name, e.target.value)} className={cls} />
      ) : (
        <input type={type} required={required} value={value || ''} onChange={e => onChange(name, e.target.value)} className={cls} />
      )}
    </div>
  )
}
