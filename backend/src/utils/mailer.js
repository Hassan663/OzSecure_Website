import { Resend } from 'resend';

/**
 * Lead emails via Resend. On every successful lead submission we send:
 *   1) sendTeamNotification(lead) → notifies MAIL_TO with the enquiry details
 *   2) sendAutoReply(lead)        → "we'll be in touch" to the submitter (if they gave a valid email)
 *
 * The API key comes ONLY from RESEND_API_KEY (never hardcoded). If it's missing,
 * email is disabled — we log a warning and skip sending, so the lead still saves
 * and local/dev without a key keeps working. Email failures NEVER break the form
 * (the caller wraps these in try/catch and always returns success once saved) —
 * but every failure is now logged LOUDLY with the full Resend error object, so
 * the cause is visible in the Render logs.
 *
 * ⚠  MAIL_FROM / MAIL_TO QUOTING
 *   In a .env file you write MAIL_FROM="OzSecure Services <noreply@ozsecure.co>"
 *   and dotenv strips the quotes. In the RENDER DASHBOARD you must paste the RAW
 *   value with NO surrounding quotes, otherwise Resend receives a `from` that
 *   literally contains " characters and rejects it with 422 validation_error.
 *   We defensively strip surrounding quotes here and warn if we had to.
 *
 * ⚠  DOMAIN VERIFICATION
 *   Resend only sends FROM a verified domain/sender. ozsecure.co is verified, so
 *   MAIL_FROM should be an @ozsecure.co address. If you ever fall back to
 *   onboarding@resend.dev, that sender can ONLY deliver to your own Resend
 *   account email.
 */

/** Trim + strip one layer of accidental surrounding quotes (a Render-dashboard classic). */
const cleanEnv = (v) => (v ?? '').toString().trim().replace(/^['"]/, '').replace(/['"]$/, '').trim();

const RAW_KEY = process.env.RESEND_API_KEY;
const RAW_FROM = process.env.MAIL_FROM;
const RAW_TO = process.env.MAIL_TO;

const API_KEY = cleanEnv(RAW_KEY);
const MAIL_FROM = cleanEnv(RAW_FROM) || 'OzSecure Services <onboarding@resend.dev>';
const MAIL_TO = cleanEnv(RAW_TO) || 'info@ozsecuresecurity.com.au';

const PHONE = '1300 101 765';
const TAGLINE = 'Trusted Protection. Powerful Presence.';
const NAVY = '#0D1B3D';
const CRIMSON = '#D72626';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maskKey = (k) => (k ? `${k.slice(0, 6)}…(${k.length} chars)` : '(none)');

let resend = null;
if (API_KEY) {
  resend = new Resend(API_KEY);

  console.log('──────── RESEND EMAIL CONFIG (at boot) ────────');
  console.log(`   RESEND_API_KEY : ${maskKey(API_KEY)}`);
  console.log(`   MAIL_FROM      : "${MAIL_FROM}"`);
  console.log(`   MAIL_TO        : "${MAIL_TO}"`);
  if (RAW_FROM && cleanEnv(RAW_FROM) !== RAW_FROM.trim()) {
    console.warn('   ⚠  MAIL_FROM had surrounding quotes — stripped. Remove the quotes in the Render dashboard.');
  }
  if (RAW_TO && cleanEnv(RAW_TO) !== RAW_TO.trim()) {
    console.warn('   ⚠  MAIL_TO had surrounding quotes — stripped. Remove the quotes in the Render dashboard.');
  }
  if (!MAIL_FROM.includes('@')) {
    console.error('   ✗  MAIL_FROM has no "@" — Resend will reject this. Expected: Name <user@your-verified-domain>');
  }
  if (/@resend\.dev/i.test(MAIL_FROM)) {
    console.warn('   ⚠  MAIL_FROM uses onboarding@resend.dev — it can ONLY deliver to your own Resend account email.');
  }
  console.log('───────────────────────────────────────────────');
} else {
  console.warn('⚠  RESEND_API_KEY not set — lead emails are DISABLED (leads still save to the store).');
}

/** Log everything Resend told us about a failure (name + statusCode + full body). */
function logResendError(context, error) {
  console.error(`✉  ${context} — FAILED`);
  console.error(`     name       : ${error?.name ?? '(none)'}`);
  console.error(`     statusCode : ${error?.statusCode ?? '(none)'}`);
  console.error(`     message    : ${error?.message ?? '(none)'}`);
  try {
    console.error(`     full error : ${JSON.stringify(error, Object.getOwnPropertyNames(error || {}))}`);
  } catch {
    console.error('     full error :', error);
  }
  if (error?.stack) console.error(`     stack      : ${error.stack}`);
}

/** The single place that actually calls Resend, with attempt/success/failure logging. */
async function send(context, payload) {
  console.log(`✉  ${context} — attempting send | from="${payload.from}" to="${payload.to}" subject="${payload.subject}"`);
  let data;
  let error;
  try {
    ({ data, error } = await resend.emails.send(payload));
  } catch (thrown) {
    // Network/auth failures surface as thrown exceptions rather than { error }.
    logResendError(`${context} (threw)`, thrown);
    throw thrown;
  }
  if (error) {
    logResendError(context, error);
    const e = new Error(`${error.name || 'resend_error'}${error.statusCode ? ` [${error.statusCode}]` : ''}: ${error.message}`);
    e.resendError = error;
    throw e;
  }
  console.log(`✉  ${context} — SENT ✓ (resend id: ${data?.id})`);
  return { sent: true, id: data?.id };
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
  return send('Team notification', {
    from: MAIL_FROM,
    to: MAIL_TO,
    replyTo,
    subject: `New enquiry — ${lead.service || 'General'} (${source})`,
    html,
  });
}

/** Friendly auto-reply to the submitter (only if a valid email was provided). */
export async function sendAutoReply(lead = {}) {
  if (!resend) return { sent: false, skipped: true };
  const email = (lead.email || '').trim();
  if (!EMAIL_RE.test(email)) {
    console.log(`✉  Auto-reply — skipped (no valid submitter email; got "${email}")`);
    return { sent: false, skipped: true, reason: 'no-valid-email' };
  }

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
          <a href="tel:1300101765" style="color:${CRIMSON};font-weight:700;text-decoration:none">${PHONE}</a>.</p>
        <p style="margin:22px 0 2px">Kind regards,</p>
        <p style="margin:0;font-weight:700;color:${NAVY}">OzSecure Services</p>
        <p style="margin:2px 0 0;font-size:13px;color:${CRIMSON};font-weight:600">${TAGLINE}</p>
      </div>
      <p style="max-width:600px;margin:14px auto 0;font-size:11px;color:#8A97AD;text-align:center">
        This is an automated confirmation — please don't reply directly. For anything urgent, call ${PHONE}.
      </p>
    </div>`;

  return send('Auto-reply', {
    from: MAIL_FROM,
    to: email,
    subject: 'Thanks for contacting OzSecure Services',
    html,
  });
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
    console.error('✉  Team notification email failed (lead still saved). Full error follows:');
    logResendError('Team notification (outer)', err.resendError || err);
  }
  try {
    const r = await sendAutoReply(lead);
    result.autoReplied = !!r.sent;
  } catch (err) {
    console.error('✉  Auto-reply email failed (lead still saved). Full error follows:');
    logResendError('Auto-reply (outer)', err.resendError || err);
  }
  return result;
}

/** Non-secret snapshot of the email config — powers the admin diagnostic endpoint. */
export function getEmailConfig() {
  return {
    resendEnabled: !!resend,
    apiKeyPresent: !!API_KEY,
    apiKeyPrefix: API_KEY ? API_KEY.slice(0, 6) : null,
    apiKeyLength: API_KEY ? API_KEY.length : 0,
    mailFrom: MAIL_FROM,
    mailTo: MAIL_TO,
    mailFromHadQuotes: !!RAW_FROM && cleanEnv(RAW_FROM) !== RAW_FROM.trim(),
    mailToHadQuotes: !!RAW_TO && cleanEnv(RAW_TO) !== RAW_TO.trim(),
    mailFromHasAt: MAIL_FROM.includes('@'),
    usingResendOnboardingSender: /@resend\.dev/i.test(MAIL_FROM),
  };
}

/** Fire a single test email and return the FULL Resend result/error (admin-only). */
export async function sendTestEmail(to) {
  if (!resend) return { ok: false, error: { message: 'RESEND_API_KEY not set — email is disabled' } };
  const dest = cleanEnv(to) || MAIL_TO;
  try {
    const r = await send('Test email', {
      from: MAIL_FROM,
      to: dest,
      subject: 'OzSecure — Resend test email',
      html: `<p>This is a test from the OzSecure API. If you received it, Resend sending works.</p>
             <p style="color:#8A97AD;font-size:12px">from: ${escapeHtml(MAIL_FROM)} → to: ${escapeHtml(dest)}</p>`,
    });
    return { ok: true, id: r.id, from: MAIL_FROM, to: dest };
  } catch (err) {
    const e = err.resendError || err;
    return {
      ok: false,
      from: MAIL_FROM,
      to: dest,
      error: { name: e?.name, statusCode: e?.statusCode, message: e?.message },
    };
  }
}
