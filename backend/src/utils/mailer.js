import nodemailer from 'nodemailer';

let transporter = null;
const devMode = !process.env.SMTP_HOST;

if (!devMode) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Send a quote/contact submission.
 * In dev mode (no SMTP_HOST configured) it logs to the console and resolves,
 * so the form can be tested end-to-end without a real mail server.
 */
export async function sendQuoteEmail(data) {
  const { name, company, email, phone, service, location, message } = data;

  if (devMode) {
    console.log('\n──────── NEW QUOTE REQUEST (dev mode — not emailed) ────────');
    console.log(JSON.stringify(data, null, 2));
    console.log('────────────────────────────────────────────────────────────\n');
    return { delivered: false, dev: true };
  }

  const rows = [
    ['Name', name],
    ['Company', company],
    ['Email', email],
    ['Phone', phone],
    ['Service', service],
    ['Site location', location],
  ]
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5B6A82;font-weight:600">${k}</td><td style="padding:6px 0">${escapeHtml(
          v
        )}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0F2340;color:#fff;padding:22px 26px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:18px">New quote request — OzSecure website</h2>
      </div>
      <div style="border:1px solid #E3E7EE;border-top:0;padding:22px 26px;border-radius:0 0 8px 8px">
        <table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
        <p style="margin:18px 0 6px;color:#5B6A82;font-weight:600">Message</p>
        <p style="margin:0;white-space:pre-wrap;font-size:14px">${escapeHtml(message || '—')}</p>
      </div>
    </div>`;

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || 'OzSecure Website <no-reply@ozsecuresecurity.com.au>',
    to: process.env.MAIL_TO || 'info@ozsecuresecurity.com.au',
    replyTo: email || undefined,
    subject: `Quote request${service ? ` — ${service}` : ''}${company ? ` (${company})` : ''}`,
    html,
  });

  return { delivered: true, messageId: info.messageId };
}
