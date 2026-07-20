'use client';
import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const initial = { name: '', company: '', email: '', phone: '', service: '', location: '', message: '', website: '' };

export default function QuoteForm() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${API}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error((data.errors && data.errors[0]) || data.message || 'Something went wrong.');
      }
      setStatus('success');
      setForm(initial);
    } catch (err) {
      setStatus('error');
      setError(err.message || 'We could not send your request. Please call 1300 101 765.');
    }
  };

  return (
    <div className="rounded-[14px] border border-hairline bg-panel p-[clamp(28px,4vw,44px)] shadow-soft">
      {status === 'success' && (
        <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-hairline bg-surface px-5 py-4 text-ink">
          <Check size={22} className="shrink-0 text-emerald-500" />
          <span>Thanks — your request has been received. Our team will be in touch shortly.</span>
        </div>
      )}
      {status === 'error' && (
        <div className="mb-5 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-5 py-4 text-[0.95rem] text-ink">{error}</div>
      )}

      <h3 className="mb-1.5 text-[1.5rem]">Request a quote</h3>
      <p className="mb-6 text-muted">Give us the basics and we&rsquo;ll handle the rest.</p>

      <form onSubmit={submit} noValidate>
        {/* honeypot */}
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={update}
          tabIndex={-1}
          autoComplete="off"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          aria-hidden
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Full name" name="name" value={form.name} onChange={update} placeholder="Your name" required />
          <Field label="Company" name="company" value={form.company} onChange={update} placeholder="Company name" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Email" name="email" type="email" value={form.email} onChange={update} placeholder="you@company.com.au" required />
          <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={update} placeholder="04xx xxx xxx" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="mb-5">
            <label className="field-label" htmlFor="service">Service needed</label>
            <select id="service" name="service" value={form.service} onChange={update} className="field-input">
              <option value="">Select a service</option>
              <option>Security</option>
              <option>Traffic Control</option>
              <option>Cleaning</option>
              <option>Labour Hire</option>
              <option>Multiple services</option>
            </select>
          </div>
          <Field label="Site location" name="location" value={form.location} onChange={update} placeholder="Suburb / city" />
        </div>
        <div className="mb-5">
          <label className="field-label" htmlFor="message">Tell us about the job</label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={update}
            placeholder="Site type, dates, shift hours, headcount — whatever you have."
            className="field-input min-h-[120px] resize-y"
          />
        </div>

        <button type="submit" disabled={status === 'loading'} className="btn btn-primary w-full justify-center disabled:opacity-70">
          {status === 'loading' ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              Send request <ArrowRight size={16} />
            </>
          )}
        </button>
        <p className="mt-3.5 text-[0.84rem] text-muted">
          By submitting, you agree to be contacted about your enquiry. We never share your details.
        </p>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div className="mb-5">
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="field-input"
      />
    </div>
  );
}
