'use client';
import { Plus, X } from 'lucide-react';

// Add/remove editor for a list of strings (requirements, features, etc.).
export default function ListEditor({ label, items, onChange, textarea, placeholder }) {
  const set = (i, v) => onChange(items.map((x, idx) => (idx === i ? v : x)));
  const add = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const Field = textarea ? 'textarea' : 'input';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="field-label !mb-0">{label}</span>
        <button type="button" onClick={add} className="flex items-center gap-1 text-[0.8rem] font-medium text-accent hover:underline">
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-[0.82rem] text-muted">None yet — add one.</p>}
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <Field
              value={item}
              onChange={(e) => set(i, e.target.value)}
              placeholder={placeholder}
              rows={textarea ? 2 : undefined}
              className="field-input !py-2 text-[0.9rem]"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-hairline text-muted hover:border-accent hover:text-accent"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
