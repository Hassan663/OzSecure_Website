import { Resend } from 'resend';

/**
 * Lead emails via Resend. On every successful lead submission we send:
 *   1) sendTeamNotification(lead) → notifies MAIL_TO with the enquiry details
 *   2) sendAutoReply(lead)        → "we'll be in touch" to the submitter (if they gave a valid email)
 *
 * The API key comes ONLY from RESEND_API_KEY (never hardcoded). If it's missing,
 * email is disabled — we log a warning and skip sending, so the lead still saves
 * and local/dev without a key keeps working. Email failures NEVER break the form
 * (the caller wraps these in try/catch and always returns success once saved).
 *
 * ⚠  DOMAIN VERIFICATION (important before go-live):
 *   Resend only lets you send FROM a verified domain/sender. Until
 *   ozsecuresecurity.com.au is verified in Resend, MAIL_FROM MUST be
 *   "onboarding@resend.dev" — and that onboarding sender can ONLY deliver to the
 *   email address of your own Resend account. Verify the domain in Resend, then
 *   set MAIL_FROM to a @ozsecuresecurity.com.au address to email real submitters.
 */

const API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'OzSecure Services <onboarding@resend.dev>';
const MAIL_TO = process.env.MAIL_TO || 'info@ozsecuresecurity.com.au';

const PHONE = '0450 717 765';
const TAGLINE = 'Trusted Protection. Powerful Presence.';
const NAVY = '#0D1B3D';
const CRIMSON = '#D72626';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let resend = null;
if (API_KEY) {
  resend = new Resend(API_KEY);
  if (/@resend\.dev/i.test(MAIL_FROM)) {
    console.log(
      'ℹ  Resend: MAIL_FROM uses onboarding@resend.dev — this ONLY delivers to your own Resend account email. ' +
        'Verify ozsecuresecurity.com.au in Resend and set MAIL_FROM to a @ozsecuresecurity.com.au address to email submitters.'
    );
  } else {
    console.log(`ℹ  Resend enabled — sending from ${MAIL_FROM}, team notifications to ${MAIL_TO}.`);
  }
} else {
  console.warn('⚠  RESEND_API_KEY not set — lead emails are DISABLED (leads still save to the store).');
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SOURCE_LABEL = { website: 'Website', chatbot: 'Chatbot', careers: 'Careers' };

function detailRows(lead) {
  const ts = lead.createdAt ? new Date(lead.createdAt) : new Date();
  return [
    ['Name', lead.name],
    ['Company', lead.company],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Service', lead.service],
    ['Location', lead.location],
    ['Source', SOURCE_LABEL[lead.source] || lead.source || 'Website'],
    ['Received', ts.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 16px 7px 0;color:#5B6A82;font-weight:600;white-space:nowrap;vertical-align:top">${k}</td>` +
        `<td style="padding:7px 0;color:#1A2540">${escapeHtml(v)}</td></tr>`
    )
    .join('');
}

/** Team notification email to MAIL_TO with the full enquiry. */
export async function sendTeamNotification(lead = {}) {
  if (!resend) return { sent: false, skipped: true };

  const source = SOURCE_LABEL[lead.source] || lead.source || 'Website';
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1A2540">
      <div style="background:${NAVY};padding:22px 26px;border-radius:10px 10px 0 0">
        <h2 style="margin:0;font-size:18px;color:#fff">New enquiry — OzSecure Services</h2>
        <p style="margin:6px 0 0;font-size:13px;color:#C7D2E6">Source: ${escapeHtml(source)}</p>
      </div>
      <div style="border:1px solid #E3E7EE;border-top:0;padding:22px 26px;border-radius:0 0 10px 10px">
        <table style="border-collapse:collapse;width:100%;font-size:14px">${detailRows(lead)}</table>
        <p style="margin:20px 0 6px;color:#5B6A82;font-weight:600;font-size:13px">Message</p>
        <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.5">${escapeHtml(lead.message || '—')}</p>
        <p style="margin:22px 0 0;font-size:12px;color:#8A97AD">Reply directly to this email to respond to the enquirer.</p>
      </div>
    </div>`;

  const replyTo = EMAIL_RE.test((lead.email || '').trim()) ? lead.email.trim() : undefined;
  const { data, error } = await resend.emails.send({
    from: MAIL_FROM,
    to: MAIL_TO,
    replyTo,
    subject: `New enquiry — ${lead.service || 'General'} (${source})`,
    html,
  });
  if (error) throw new Error(error.message || 'Resend error (team notification)');
  return { sent: true, id: data?.id };
}

/** Friendly auto-reply to the submitter (only if a valid email was provided). */
export async function sendAutoReply(lead = {}) {
  if (!resend) return { sent: false, skipped: true };
  const email = (lead.email || '').trim();
  if (!EMAIL_RE.test(email)) return { sent: false, skipped: true, reason: 'no-valid-email' };

  const firstName = (lead.name || '').trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi there,';
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1A2540">
      <div style="background:${NAVY};padding:26px;border-radius:10px 10px 0 0;text-align:center">
        <h1 style="margin:0;font-size:20px;color:#fff;letter-spacing:.3px">OzSecure Services</h1>
        <p style="margin:8px 0 0;font-size:13px;color:${CRIMSON};font-weight:700">${TAGLINE}</p>
      </div>
      <div style="border:1px solid #E3E7EE;border-top:0;padding:26px;border-radius:0 0 10px 10px;line-height:1.6;font-size:15px">
        <p style="margin:0 0 14px">${greeting}</p>
        <p style="margin:0 0 14px">Thanks for getting in touch with <strong>OzSecure Services</strong>. We've received your enquiry and a member of our team will be in touch shortly.</p>
        <p style="margin:0 0 14px">If it's urgent, our operations desk is available 24/7 — call us any time on
          <a href="tel:+61450717765" style="color:${CRIMSON};font-weight:700;text-decoration:none">${PHONE}</a>.</p>
        <p style="margin:22px 0 2px">Kind regards,</p>
        <p style="margin:0;font-weight:700;color:${NAVY}">OzSecure Services</p>
        <p style="margin:2px 0 0;font-size:13px;color:${CRIMSON};font-weight:600">${TAGLINE}</p>
      </div>
      <p style="max-width:600px;margin:14px auto 0;font-size:11px;color:#8A97AD;text-align:center">
        This is an automated confirmation — please don't reply directly. For anything urgent, call ${PHONE}.
      </p>
    </div>`;

  const { data, error } = await resend.emails.send({
    from: MAIL_FROM,
    to: email,
    subject: 'Thanks for contacting OzSecure Services',
    html,
  });
  if (error) throw new Error(error.message || 'Resend error (auto-reply)');
  return { sent: true, id: data?.id };
}

/**
 * Send both lead emails. Never throws — each send is isolated so one failure
 * doesn't stop the other. Returns { notified, autoReplied }.
 */
export async function sendLeadEmails(lead = {}) {
  const result = { notified: false, autoReplied: false };
  if (!resend) {
    console.warn(`✉  Email skipped (no RESEND_API_KEY) — lead saved: ${lead.name || 'unknown'} (${lead.source || 'website'}).`);
    return result;
  }
  try {
    const r = await sendTeamNotification(lead);
    result.notified = !!r.sent;
  } catch (err) {
    console.error('Team notification email failed (lead still saved):', err.message);
  }
  try {
    const r = await sendAutoReply(lead);
    result.autoReplied = !!r.sent;
  } catch (err) {
    console.error('Auto-reply email failed (lead still saved):', err.message);
  }
  return result;
}
