import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { sendQuoteEmail } from '../utils/mailer.js';
import { createQuery } from '../store/index.js';

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

  // 1) Persist first — this is the source of truth for the admin panel.
  try {
    await createQuery(req.body);
  } catch (err) {
    console.error('Quote save failed:', err);
    return res
      .status(500)
      .json({ ok: false, message: 'We could not record your request right now. Please call 0450 717 765.' });
  }

  // 2) Then attempt email. A delivery failure must NOT fail the request — the
  //    submission is already saved and the user should still see success.
  let mail = { delivered: false };
  try {
    mail = await sendQuoteEmail(req.body);
  } catch (err) {
    console.error('Quote email failed (submission still saved):', err);
  }

  return res.status(200).json({
    ok: true,
    message: 'Thanks — your request has been received. Our team will be in touch shortly.',
    ...mail,
  });
});

export default router;
