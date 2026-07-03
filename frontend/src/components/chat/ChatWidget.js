'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Send, Phone, Mail, ArrowRight } from 'lucide-react';
import Logo from '../Logo';
import { site } from '@/data/site';
import {
  WELCOME, FALLBACK, QUICK_REPLIES, QUOTE_INTRO, QUOTE_STEPS, LAUNCHER_LABEL,
  matchIntent, resolveChip, buildLeadPayload,
} from '@/data/botKnowledge';

// ── Swap the launcher icon here (e.g. Shield, HelpCircle) ────────────────────
const LAUNCHER_ICON = MessageCircle;

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Auto-link the business phone/email wherever they appear in a bot message.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LINK_RE = new RegExp(`(${escapeRe(site.email)}|${escapeRe(site.phonePrimary)})`, 'g');
function Linkify({ text }) {
  return text.split(LINK_RE).map((part, i) => {
    if (part === site.email) {
      return (
        <a key={i} href={`mailto:${site.email}`} className="font-medium text-accent underline underline-offset-2">
          {part}
        </a>
      );
    }
    if (part === site.phonePrimary) {
      return (
        <a key={i} href={`tel:${site.phonePrimaryTel}`} className="font-medium text-accent underline underline-offset-2">
          {part}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [flow, setFlow] = useState({ active: false, step: 0, data: {} });
  const [hasNotif, setHasNotif] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDone, setTooltipDone] = useState(false);
  const [reduced, setReduced] = useState(false);

  const idRef = useRef(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const launcherRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    setReduced(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // One-time tooltip a few seconds after load.
  useEffect(() => {
    if (open || tooltipDone) return undefined;
    const t = setTimeout(() => setShowTooltip(true), 4500);
    return () => clearTimeout(t);
  }, [open, tooltipDone]);

  // Keep scrolled to the latest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  // Focus management + trap + Esc while open.
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeChat();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // A message is { id, from, text, bullets?, note?, chips? }.
  const addMessage = (from, payload) => {
    const id = (idRef.current += 1);
    const msg = typeof payload === 'string' ? { text: payload } : payload;
    setMessages((m) => [...m, { id, from, ...msg }]);
  };

  // Bot reply with a typing delay so it feels alive.
  const botSay = (answer, after = null) => {
    const msg = typeof answer === 'string' ? { text: answer } : answer;
    setTyping(true);
    const delay = reduced ? 0 : Math.min(1300, 450 + (msg.text?.length || 0) * 10);
    const t = setTimeout(() => {
      setTyping(false);
      addMessage('bot', msg);
      if (after) after();
    }, delay);
    timers.current.push(t);
  };

  const openChat = () => {
    setOpen(true);
    setHasNotif(false);
    setShowTooltip(false);
    setTooltipDone(true);
    if (messages.length === 0) botSay({ text: WELCOME, chips: QUICK_REPLIES });
  };
  const closeChat = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };
  const toggle = () => (open ? closeChat() : openChat());

  const startFlow = () => {
    setFlow({ active: true, step: 0, data: {} });
    botSay(`${QUOTE_INTRO} ${QUOTE_STEPS[0].prompt}`);
  };

  // Render an answer object (may start the lead flow instead of speaking).
  const respond = (res) => {
    if (!res) {
      botSay(FALLBACK);
      return;
    }
    if (res.startFlow) {
      startFlow();
      return;
    }
    botSay(res);
  };

  const handleFlowAnswer = (text) => {
    const step = QUOTE_STEPS[flow.step];
    const err = step.validate(text);
    if (err) {
      botSay(err); // re-ask the same step
      return;
    }
    const data = { ...flow.data, ...step.apply(text) };
    const next = flow.step + 1;
    if (next < QUOTE_STEPS.length) {
      setFlow({ active: true, step: next, data });
      botSay(QUOTE_STEPS[next].prompt);
    } else {
      setFlow({ active: false, step: 0, data: {} });
      submitLead(data);
    }
  };

  const submitLead = async (data) => {
    setTyping(true);
    try {
      const res = await fetch(`${API}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildLeadPayload(data)),
      });
      const json = await res.json().catch(() => ({}));
      setTyping(false);
      if (!res.ok || !json.ok) throw new Error();
      addMessage('bot', {
        text: 'Thanks! Your request is in — our team will be in touch shortly. 🎉',
        chips: [
          { id: 'services', label: 'Our Services' },
          { action: 'call', label: `Call ${site.phonePrimary}` },
        ],
      });
    } catch {
      setTyping(false);
      addMessage('bot', {
        text: `Sorry — I couldn’t send that just now. Please call ${site.phonePrimary} and we’ll sort it out.`,
        chips: [{ action: 'call', label: 'Call now' }],
      });
    }
  };

  const send = (text) => {
    const value = text.trim();
    if (!value || typing) return;
    addMessage('user', value);
    setInput('');
    if (flow.active) handleFlowAnswer(value);
    else respond(matchIntent(value));
  };

  const onChip = (chip) => {
    if (typing) return;
    addMessage('user', chip.label);
    if (chip.action === 'quote' || chip.id === 'quote') {
      startFlow();
      return;
    }
    respond(resolveChip(chip.id));
  };

  // A chip is a button (intent / quote) or a tappable link (call / email / route).
  const chipClass =
    'inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-hairline bg-panel px-3.5 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:border-accent hover:text-accent';
  const renderChip = (c, key) => {
    if (c.action === 'call') {
      return (
        <a key={key} href={`tel:${site.phonePrimaryTel}`} className={chipClass}>
          <Phone size={13} /> {c.label}
        </a>
      );
    }
    if (c.action === 'email') {
      return (
        <a key={key} href={`mailto:${site.email}`} className={chipClass}>
          <Mail size={13} /> {c.label}
        </a>
      );
    }
    if (c.action === 'link') {
      return (
        <Link key={key} href={c.href} onClick={closeChat} className={chipClass}>
          {c.label} <ArrowRight size={13} />
        </Link>
      );
    }
    return (
      <button key={key} onClick={() => onChip(c)} className={chipClass}>
        {c.label}
      </button>
    );
  };

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end sm:bottom-6 sm:right-6">
        {showTooltip && !open && (
          <div className="chat-pop mb-3 flex items-center gap-2 rounded-[12px] border border-hairline bg-panel px-3.5 py-2.5 text-[0.88rem] text-ink shadow-soft">
            {LAUNCHER_LABEL}
            <button
              onClick={() => {
                setShowTooltip(false);
                setTooltipDone(true);
              }}
              aria-label="Dismiss"
              className="text-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <button
          ref={launcherRef}
          onClick={toggle}
          aria-label={open ? 'Close chat' : 'Open chat'}
          aria-expanded={open}
          className="chat-launcher group relative flex h-[56px] w-[56px] items-center justify-center rounded-full bg-navy text-white shadow-[0_10px_30px_-8px_rgba(13,27,61,.6)] ring-2 ring-accent/60 transition-transform duration-200 hover:scale-105 sm:h-[60px] sm:w-[60px]"
        >
          {!open && <span className="chat-ring pointer-events-none absolute inset-0 rounded-full bg-accent/30" />}
          {!open && hasNotif && (
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-accent ring-2 ring-bg" />
          )}
          <span className="chat-icon relative">
            {open ? <X size={26} strokeWidth={1.8} /> : <LAUNCHER_ICON size={26} strokeWidth={1.8} />}
          </span>
        </button>
      </div>

      {/* Window */}
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="OzSecure Assistant chat"
          className="chat-pop fixed inset-0 z-[60] flex flex-col border-hairline bg-bg sm:inset-auto sm:bottom-[92px] sm:right-6 sm:h-[560px] sm:max-h-[calc(100vh-120px)] sm:w-[380px] sm:rounded-[16px] sm:border sm:shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Logo className="h-7 w-auto" />
              <div>
                <div className="text-[0.95rem] font-semibold text-ink">OzSecure Assistant</div>
                <div className="flex items-center gap-1.5 text-[0.72rem] text-muted">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online · replies instantly
                </div>
              </div>
            </div>
            <button
              onClick={closeChat}
              aria-label="Close chat"
              className="flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface hover:text-ink"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto bg-surface/40 px-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className="chat-msg">
                <div className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-[0.92rem] leading-relaxed ${
                      m.from === 'user'
                        ? 'rounded-br-[3px] bg-accent text-white'
                        : 'rounded-bl-[3px] border border-hairline bg-panel text-ink'
                    }`}
                  >
                    {m.from === 'bot' ? <Linkify text={m.text} /> : m.text}
                    {m.bullets && (
                      <ul className="mt-2 space-y-1.5">
                        {m.bullets.map((b, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                            <span>
                              <Linkify text={b} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {m.note && <p className="mt-2 text-[0.8rem] text-muted">{m.note}</p>}
                  </div>
                </div>
                {m.from === 'bot' && m.chips && (
                  <div className="mt-2 flex flex-wrap gap-2">{m.chips.map((c, i) => renderChip(c, `${m.id}-${i}`))}</div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-[14px] rounded-bl-[3px] border border-hairline bg-panel px-4 py-3">
                  <span className="chat-dot h-2 w-2 rounded-full bg-muted" />
                  <span className="chat-dot h-2 w-2 rounded-full bg-muted" />
                  <span className="chat-dot h-2 w-2 rounded-full bg-muted" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-hairline px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              aria-label="Type your message"
              className="field-input !py-2.5 text-[0.92rem]"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-accent text-white transition-opacity hover:bg-accent-strong disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
