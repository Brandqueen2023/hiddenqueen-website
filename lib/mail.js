/* E-Mail-Versand ueber Brevo (Transaktions-API). Sender ist die bei Brevo
   verifizierte Domain-Adresse whispers@thehiddenqueen.de. */
const BREVO_API = 'https://api.brevo.com/v3';
const SENDER = { name: 'The Hidden Queen', email: process.env.HQ_MAIL_FROM || 'whispers@thehiddenqueen.de' };

async function brevoSend(body) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY ist nicht gesetzt.');
  const res = await fetch(BREVO_API + '/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error('Brevo-Versand fehlgeschlagen: ' + res.status + ' ' + errBody);
  }
  return res.json().catch(() => null);
}

async function sendMail({ to, subject, html, text, replyTo }) {
  return brevoSend({
    sender: SENDER,
    to: (Array.isArray(to) ? to : [to]).map((email) => ({ email })),
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {}),
    ...(replyTo ? { replyTo: { email: replyTo } } : {}),
  });
}

async function sendTemplateMail({ to, templateId, params }) {
  return brevoSend({
    to: (Array.isArray(to) ? to : [to]).map((email) => ({ email })),
    templateId,
    params: params || {},
  });
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = { sendMail, sendTemplateMail, esc };
