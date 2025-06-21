// --- Helper component for resume form fields ---
function DetailInput({ label, value, onChange, name, type = 'text' }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {type === 'textarea' ? (
                <textarea id={name} name={name} value={Array.isArray(value) ? value.join('\n') : value || ''}
                          onChange={onChange} rows={4}
                          className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            ) : (
                <input type={type} id={name} name={name} value={Array.isArray(value) ? value.join(', ') : value || ''}
                       onChange={onChange}
                       className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            )}
        </div>
    );
}

export default DetailInput;