/**
 * 4DAYVELOPMENT — Serveur Node.js
 * Express · Nodemailer · Zod · Pino · Helmet CSP
 */

require('dotenv').config();

const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');
const path       = require('path');
const { z }      = require('zod');
const pino       = require('pino');

/* ── Logger Pino ──────────────────────────────────────── */
const logger = pino(
  process.env.NODE_ENV === 'production'
    ? {}                                          // JSON brut en prod
    : { transport: { target: 'pino-pretty', options: { colorize: true } } }
);

/* ── Bootstrap : variables critiques ─────────────────── */
function bootstrap() {
  const required = ['MAIL_USER', 'MAIL_PASS', 'ALLOWED_ORIGIN'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    logger.warn({ missing }, 'Variables d\'environnement manquantes : ' + missing.join(', '));
  }
}
bootstrap();

/* ── App ──────────────────────────────────────────────── */
const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Helmet avec CSP explicite ────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   [
        "'self'",
        'cdnjs.cloudflare.com',          // Three.js CDN
        "'unsafe-inline'",               // inline scripts des pages externes (essentiel/lead/brief)
      ],
      styleSrc:    [
        "'self'",
        'fonts.googleapis.com',
        "'unsafe-inline'",               // styles inline nécessaires
      ],
      fontSrc:     ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'blob:'],
      connectSrc:  ["'self'"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}));

/* ── Middlewares ──────────────────────────────────────── */
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

app.use(cors({
  origin:  process.env.ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
}));

app.use(express.static(path.join(__dirname, 'public')));

/* ── Rate limiting ────────────────────────────────────── */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders:   false,
});

/* ── Transporteur Nodemailer ──────────────────────────── */
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ── Schéma Zod ───────────────────────────────────────── */
const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères.'),

  email: z.string()
    .trim()
    .email('Adresse email invalide.')
    .max(254, 'Email trop long.'),

  phone: z.string()
    .trim()
    .max(30, 'Numéro trop long.')
    .optional()
    .or(z.literal('')),

  subject: z.string()
    .trim()
    .max(200, 'Sujet trop long.')
    .optional()
    .or(z.literal('')),

  message: z.string()
    .trim()
    .min(10, 'Le message doit contenir au moins 10 caractères.')
    .max(5000, 'Le message ne peut pas dépasser 5000 caractères.'),

  budget: z.string()
    .trim()
    .max(50)
    .optional()
    .or(z.literal('')),

  service: z.string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal('')),

  // Honeypot — doit rester vide
  website: z.literal('').optional(),
});

/* ── Middleware de validation Zod ─────────────────────── */
function validateWith(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }));
      logger.warn({ errors, ip: req.ip }, 'Validation échouée');
      return res.status(400).json({ success: false, errors });
    }
    // Remplace req.body par les données parsées (trimmed, typées)
    req.validatedBody = result.data;
    next();
  };
}

/* ── Utilitaire HTML ──────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/* ── Template email HTML ──────────────────────────────── */
function buildEmailHTML(data) {
  const { name, email, phone, subject, message, budget, service } = data;
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Helvetica Neue', sans-serif; background: #0a0a0a; margin: 0; padding: 32px; }
      .card { max-width: 600px; margin: 0 auto; background: #141414; border: 1px solid #222; border-radius: 20px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #DA5426, #f2b13b, #884083); padding: 32px; text-align: center; color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
      .body { padding: 32px; }
      .field { margin-bottom: 20px; }
      .label { font-size: 11px; font-weight: 700; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
      .value { font-size: 15px; color: #f0f0f0; line-height: 1.6; }
      .message-box { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; font-size: 15px; color: #d0d0d0; line-height: 1.7; white-space: pre-wrap; }
      .badge { display: inline-block; background: rgba(218,84,38,0.2); border: 1px solid rgba(218,84,38,0.4); color: #f2b13b; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; }
      .footer { padding: 20px 32px; border-top: 1px solid #1a1a1a; text-align: center; }
      .footer p { font-size: 12px; color: #444; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">🚀 Nouveau message — 4dayvelopment</div>
      <div class="body">
        <div class="field"><div class="label">Nom</div><div class="value">${escapeHtml(name)}</div></div>
        <div class="field"><div class="label">Email</div><div class="value"><a href="mailto:${escapeHtml(email)}" style="color:#f2b13b">${escapeHtml(email)}</a></div></div>
        ${phone  ? `<div class="field"><div class="label">Téléphone</div><div class="value">${escapeHtml(phone)}</div></div>` : ''}
        ${service ? `<div class="field"><div class="label">Service</div><div class="value"><span class="badge">${escapeHtml(service)}</span></div></div>` : ''}
        ${budget  ? `<div class="field"><div class="label">Budget</div><div class="value"><span class="badge">${escapeHtml(budget)}</span></div></div>` : ''}
        ${subject ? `<div class="field"><div class="label">Sujet</div><div class="value">${escapeHtml(subject)}</div></div>` : ''}
        <div class="field"><div class="label">Message</div><div class="message-box">${escapeHtml(message)}</div></div>
      </div>
      <div class="footer">
        <p>Reçu le ${new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/* ═══════════════════════════════════════════════════════
   ROUTES API
═══════════════════════════════════════════════════════ */

/* ── POST /api/contact ────────────────────────────────── */
app.post('/api/contact', contactLimiter, validateWith(contactSchema), async (req, res) => {
  const data = req.validatedBody;

  // Honeypot — bot détecté si le champ est rempli
  if (data.website) {
    logger.warn({ ip: req.ip }, 'Honeypot déclenché');
    return res.status(400).json({ success: false, message: 'Bot détecté.' });
  }

  // Appel webhook n8n
  if (process.env.N8N_WEBHOOK_URL) {
    try {
      await fetch(process.env.N8N_WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      logger.info({ name: data.name }, 'Webhook n8n déclenché');
    } catch (webhookErr) {
      logger.warn({ err: webhookErr.message }, 'Webhook n8n échoué (non bloquant)');
    }
  }

  const mailConfigured = process.env.MAIL_USER && !process.env.MAIL_USER.includes('ton-email');

  if (mailConfigured) {
    try {
      await transporter.sendMail({
        from:    `"4dayvelopment" <${process.env.MAIL_USER}>`,
        to:      process.env.MAIL_TO || process.env.MAIL_USER,
        replyTo: data.email,
        subject: `[Contact] ${data.subject || 'Nouveau message'} — ${data.name}`,
        html:    buildEmailHTML(data),
      });

      await transporter.sendMail({
        from:    `"4dayvelopment" <${process.env.MAIL_USER}>`,
        to:      data.email,
        subject: '✅ On a bien reçu votre message !',
        html: `
          <div style="font-family:sans-serif;background:#0a0a0a;padding:32px;">
            <div style="max-width:500px;margin:0 auto;background:#141414;border-radius:20px;padding:40px;border:1px solid #222;">
              <h2 style="color:#f2b13b;font-size:22px;margin-bottom:16px;">Bonjour ${escapeHtml(data.name)} 👋</h2>
              <p style="color:#aaa;line-height:1.7;margin-bottom:24px;">
                Merci pour votre message ! Notre équipe l'a bien reçu et vous répondra <strong style="color:#f0f0f0">sous 24h</strong>.
              </p>
              <div style="background:rgba(218,84,38,0.1);border:1px solid rgba(218,84,38,0.2);border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="color:#f2b13b;font-size:13px;font-weight:700;margin-bottom:8px;">📋 VOTRE MESSAGE</p>
                <p style="color:#d0d0d0;font-size:14px;line-height:1.6;">${escapeHtml(data.message)}</p>
              </div>
              <p style="color:#555;font-size:13px;">En attendant, vous pouvez nous joindre directement sur WhatsApp ou consulter notre site.</p>
            </div>
          </div>
        `,
      });

      logger.info({ name: data.name, email: data.email }, 'Email envoyé avec succès');
    } catch (err) {
      logger.warn({ err: err.message }, 'Envoi email échoué (non bloquant)');
    }
  } else {
    logger.info({ name: data.name }, 'Email non configuré — skipped');
  }

  return res.json({ success: true, message: 'Message envoyé avec succès ! Nous vous répondons sous 24h.' });
});

/* ── GET /api/stats ───────────────────────────────────── */
app.get('/api/stats', apiLimiter, (req, res) => {
  res.json({ sites: 152, satisfaction: 98, delai: 4, support: '24/7', avis: '4.9/5', clients: 150 });
});

/* ── GET /api/toasts ──────────────────────────────────── */
app.get('/api/toasts', apiLimiter, (req, res) => {
  const toasts = [
    { emoji: '👀', name: '4 personnes regardent ce site',       detail: 'en ce moment même',             time: 'En direct' },
    { emoji: '🇫🇷', name: 'Marie L. vient de commander',        detail: 'Site vitrine professionnel',    time: 'au cours du mois' },
    { emoji: '👀', name: '7 personnes consultent nos tarifs',   detail: 'en ce moment même',             time: 'En direct' },
    { emoji: '⭐', name: 'Thomas B. signe son contrat',         detail: 'Refonte complète e-commerce',   time: 'au cours du mois' },
    { emoji: '👀', name: '2 personnes remplissent le brief',    detail: 'en ce moment même',             time: 'En direct' },
    { emoji: '🚀', name: 'Sophie R. donne 5 étoiles',           detail: '"Résultat incroyable, merci !"',time: 'au cours du mois' },
    { emoji: '👀', name: '5 personnes regardent ce site',       detail: 'en ce moment même',             time: 'En direct' },
    { emoji: '💼', name: 'Karim D. réserve une démo',           detail: 'Application web sur-mesure',    time: 'au cours du mois' },
    { emoji: '👀', name: '3 personnes consultent les services', detail: 'en ce moment même',             time: 'En direct' },
    { emoji: '📈', name: 'Julie M. — +340% de conv.',           detail: 'Site Pro + SEO avancé',         time: 'au cours du mois' },
    { emoji: '👀', name: '6 personnes découvrent l\'agence',    detail: 'en ce moment même',             time: 'En direct' },
    { emoji: '🎯', name: 'Amandine C. — 3 000€/mois',           detail: 'Boutique e-commerce lancée',    time: 'au cours du mois' },
    { emoji: '👀', name: '9 personnes regardent ce site',       detail: 'en ce moment même',             time: 'En direct' },
    { emoji: '🇧🇪', name: 'Lucas V. démarre son projet',        detail: 'Site vitrine + blog',           time: 'au cours du mois' },
  ];
  res.json(toasts);
});

/* ── Fallback → 404 ──────────────────────────────────── */
app.get('/{*splat}', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

/* ── Démarrage ────────────────────────────────────────── */
app.listen(PORT, () => {
  logger.info({ port: PORT }, '4DAYVELOPMENT — Server actif');
});
