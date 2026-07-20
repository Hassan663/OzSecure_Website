import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { sendLeadEmails } from '../utils/mailer.js';
import { createQuery, markEmailSent } from '../store/index.js';

const router = Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  // Email validated when present; at least one contact method is required below
  // (the chatbot may collect a phone instead of an email).
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('company').optional().trim().isLength({ max: 160 }),
  body('phone').optional().trim().isLength({ max: 40 }),
  body('service').optional().trim().isLength({ max: 80 }),
  body('location').optional().trim().isLength({ max: 120 }),
  body('message').optional().trim().isLength({ max: 4000 }),
  body('source').optional().trim().isIn(['website', 'chatbot', 'careers']).withMessage('Invalid source'),
  // honeypot — bots fill hidden fields; humans never do
  body('website').optional().isEmpty().withMessage('Spam detected'),
  // require an email OR a phone
  body().custom((_v, { req }) => {
    if (!req.body.email && !req.body.phone) throw new Error('Please provide an email or phone number');
    return true;
  }),
];

router.post('/', validators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array().map((e) => e.msg) });
  }

  // 1) Persist first — this is the source of truth for the admin panel. Email
  //    must NEVER block or fail this step.
  let lead;
  try {
    lead = await createQuery(req.body);
  } catch (err) {
    console.error('Quote save failed:', err);
    return res
      .status(500)
      .json({ ok: false, message: 'We could not record your request right now. Please call 1300 101 765.' });
  }

  // 2) Then send the team notification + submitter auto-reply via Resend.
  //    sendLeadEmails never throws; a delivery failure must not fail the request.
  let emails = { notified: false, autoReplied: false };
  try {
    console.log(`✉  Lead saved (id=${lead.id}, source=${lead.source || 'website'}) — starting email step…`);
    emails = await sendLeadEmails(lead);
    console.log(`✉  Email step finished → notified=${emails.notified} autoReplied=${emails.autoReplied}`);
    if (emails.notified) await markEmailSent(lead.id, true);
  } catch (err) {
    console.error('✉  Lead email step threw (submission still saved):', err?.stack || err);
  }

  return res.status(200).json({
    ok: true,
    message: 'Thanks — your request has been received. Our team will be in touch shortly.',
    emailSent: emails.notified,
  });
});

export default router;
