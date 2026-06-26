'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import Logo from '../Logo';
import { site } from '@/data/site';
import {
  WELCOME, FALLBACK, QUICK_REPLIES, QUOTE_INTRO, QUOTE_STEPS, LAUNCHER_LABEL,
  matchIntent, resolveChip, buildLeadPayload,
} from '@/data/botFlows';

// ── Swap the launcher icon here (e.g. Shield, HelpCircle) ────────────────────
const LAUNCHER_ICON = MessageCircle;

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    return () => timers.current.forEach(clearTimeout);
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

  const addMessage = (from, text, chips = null) => {
    const id = (idRef.current += 1);
    setMessages((m) => [...m, { id, from, text, chips }]);
  };

  // Bot reply with a typing delay so it feels alive.
  const botSay = (text, chips = null, after = null) => {
    setTyping(true);
    const delay = reduced ? 0 : Math.min(1200, 450 + text.length * 11);
    const t = setTimeout(() => {
      setTyping(false);
      addMessage('bot', text, chips);
      if (after) after();
    }, delay);
    timers.current.push(t);
  };

  const openChat = () => {
    setOpen(true);
    setHasNotif(false);
    setShowTooltip(false);
    setTooltipDone(true);
    if (messages.length === 0) botSay(WELCOME, QUICK_REPLIES);
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

  const respond = (res) => {
    if (!res) {
      botSay(FALLBACK, null, startFlow);
      return;
    }
    if (res.startFlow) {
      startFlow();
      return;
    }
    botSay(res.text, res.chips || null);
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
      addMessage('bot', 'Thanks! Our team will be in touch shortly. 🎉', [{ id: 'services', label: 'Our Services' }]);
    } catch {
      setTyping(false);
      addMessage('bot', `Sorry — I couldn't send that just now. Please call ${site.phonePrimary} and we'll sort it out.`);
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
    respond(resolveChip(chip.id));
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
          className="chat-launcher group relative flex h-[56px] w-[56px] items-center justify-center rounded-full bg-navy text-white shadow-[0_10px_30px_-8px_rgba(15,35,64,.6)] ring-2 ring-accent/60 transition-transform duration-200 hover:scale-105 sm:h-[60px] sm:w-[60px]"
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
          className="chat-pop fixed inset-0 z-[60] flex flex-col border-hairline bg-bg sm:inset-auto sm:bottom-[92px] sm:right-6 sm:h-[560px] sm:max-h-[calc(100vh-120px)] sm:w-[360px] sm:rounded-[16px] sm:border sm:shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Logo className="h-7 w-auto" />
              <div>
                <div className="text-[0.95rem] font-semibold text-ink">OzSecure Assistant</div>
                <div className="flex items-center gap-1.5 text-[0.72rem] text-muted">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
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
              <div key={m.id}>
                <div className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-[0.92rem] leading-relaxed ${
                      m.from === 'user'
                        ? 'rounded-br-[3px] bg-accent text-white'
                        : 'rounded-bl-[3px] border border-hairline bg-panel text-ink'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
                {m.from === 'bot' && m.chips && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.chips.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onChip(c)}
                        className="rounded-full border border-hairline bg-panel px-3.5 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:border-accent hover:text-accent"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
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
              placeholder="Type your message…"
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
