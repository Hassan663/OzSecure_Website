'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Briefcase, ChevronDown, ArrowRight, Check, Loader2, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ApplyModal({ job, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', website: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const upd = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!EMAIL_RE.test(form.email.trim())) return setError('Please enter a valid email.');
    setError('');
    setStatus('loading');
    const roleLine = job?.title ? `Position: ${job.title}${job.type ? ` (${job.type})` : ''}` : 'General expression of interest';
    try {
      const res = await fetch(`${API}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: 'Careers',
          message: `${roleLine}\n\n${form.message}`.trim(),
          website: form.website, // honeypot
          source: 'careers',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error((data.errors && data.errors[0]) || data.message || 'Something went wrong.');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'We could not send your application. Please call 0450 717 765.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Job application">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div ref={dialogRef} className="chat-pop relative flex max-h-[92vh] w-full flex-col overflow-hidden border-hairline bg-panel shadow-2xl sm:max-w-[520px] sm:rounded-[16px] sm:border">
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div>
            <h3 className="text-[1.2rem]">Apply{job?.title ? `: ${job.title}` : ''}</h3>
            {job?.type && <p className="mt-0.5 text-[0.85rem] text-muted">{job.type} · {job.location}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/12">
              <Check size={24} className="text-emerald-500" />
            </div>
            <h4 className="mt-4 text-[1.25rem]">Application received</h4>
            <p className="mx-auto mt-2 max-w-[38ch] text-[0.96rem] leading-relaxed text-muted">
              Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''} — our team will review it and be in touch. 🎉
            </p>
            <button onClick={onClose} className="btn btn-primary mt-6">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex-1 overflow-y-auto px-5 py-5" data-lenis-prevent>
            {status === 'error' && (
              <div className="mb-4 rounded-[10px] border border-accent/30 bg-accent/[0.06] px-4 py-3 text-[0.9rem] text-ink">{error}</div>
            )}
            <input type="text" name="website" value={form.website} onChange={upd} tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
            <div className="space-y-4">
              <div>
                <label className="field-label" htmlFor="ap-name">Full name <span className="text-accent">*</span></label>
                <input ref={firstRef} id="ap-name" name="name" value={form.name} onChange={upd} className="field-input" placeholder="Your name" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="ap-email">Email <span className="text-accent">*</span></label>
                  <input id="ap-email" name="email" type="email" value={form.email} onChange={upd} className="field-input" placeholder="you@email.com" />
                </div>
                <div>
                  <label className="field-label" htmlFor="ap-phone">Phone</label>
                  <input id="ap-phone" name="phone" type="tel" value={form.phone} onChange={upd} className="field-input" placeholder="04xx xxx xxx" />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="ap-msg">Cover note</label>
                <textarea id="ap-msg" name="message" value={form.message} onChange={upd} rows={4} className="field-input resize-y" placeholder="Your experience, licences/tickets, and availability." />
              </div>
            </div>
            <button type="submit" disabled={status === 'loading'} className="btn btn-primary mt-5 w-full justify-center disabled:opacity-70">
              {status === 'loading' ? (<><Loader2 size={16} className="animate-spin" /> Sending…</>) : (<>Submit application <ArrowRight size={16} /></>)}
            </button>
            <p className="mt-3 text-[0.82rem] text-muted">By applying, you agree to be contacted about roles at OzSecure. We never share your details.</p>
          </form>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, expanded, onToggle, onApply }) {
  return (
    <div className="rounded-[12px] border border-hairline bg-panel p-6 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[1.3rem]">{job.title}</h3>
            {job.type && <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[0.72rem] font-semibold uppercase tracking-wide text-accent">{job.type}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.88rem] text-muted">
            {job.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-accent" /> {job.location}</span>}
            {job.category && <span className="inline-flex items-center gap-1.5"><Briefcase size={14} className="text-accent" /> {job.category}</span>}
          </div>
        </div>
        <button onClick={onApply} className="btn btn-primary shrink-0 !py-2.5">Apply <ArrowRight size={15} /></button>
      </div>

      {job.shortDescription && <p className="mt-4 text-[0.98rem] leading-relaxed text-muted">{job.shortDescription}</p>}

      {(job.fullDescription || (job.requirements && job.requirements.length > 0)) && (
        <>
          <button onClick={onToggle} aria-expanded={expanded} className="mt-4 inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-accent">
            {expanded ? 'Hide details' : 'View details'}
            <ChevronDown size={15} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          {expanded && (
            <div className="mt-4 border-t border-hairline pt-4">
              {job.fullDescription &&
                job.fullDescription.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i} className="mb-3 text-[0.98rem] leading-relaxed text-muted">{p}</p>
                ))}
              {job.requirements?.length > 0 && (
                <>
                  <h4 className="mt-5 text-[1.05rem]">What you’ll need</h4>
                  <ul className="mt-3 grid gap-2">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[0.96rem] text-ink">
                        <Check size={17} className="mt-0.5 shrink-0 text-accent" /> {r}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <button onClick={onApply} className="btn btn-primary mt-6 !py-2.5">Apply for this role <ArrowRight size={15} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CareersJobs({ jobs }) {
  const [expandedId, setExpandedId] = useState(null);
  const [applyJob, setApplyJob] = useState(null); // job object, or {} for general, or null (closed)

  if (!jobs || jobs.length === 0) {
    return (
      <>
        <div className="rounded-[12px] border border-hairline bg-panel p-8 text-center sm:p-12">
          <h3 className="text-[1.4rem]">No current openings</h3>
          <p className="mx-auto mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-muted">
            We hire across all four trades year-round. Send us your details and we’ll be in touch when something suits —
            often before it’s advertised.
          </p>
          <button onClick={() => setApplyJob({})} className="btn btn-primary mt-6">Register your interest <ArrowRight size={16} /></button>
        </div>
        {applyJob && <ApplyModal job={applyJob.title ? applyJob : null} onClose={() => setApplyJob(null)} />}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-5">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            expanded={expandedId === job.id}
            onToggle={() => setExpandedId((id) => (id === job.id ? null : job.id))}
            onApply={() => setApplyJob(job)}
          />
        ))}
      </div>
      {applyJob && <ApplyModal job={applyJob.title ? applyJob : null} onClose={() => setApplyJob(null)} />}
    </>
  );
}
