/* E-Mail-Versand ueber Resend (gleicher Account wie brandqueen.de /
   messestandvergleich.de). thehiddenqueen.de ist dort aktuell nicht als
   Sendedomain verifiziert, deshalb Versand ueber die verifizierte Domain
   brandqueen.de mit HiddenQueen-Absendernamen (siehe Abschlussbericht). */
async function sendMail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY ist nicht gesetzt.');
  const from = process.env.HQ_MAIL_FROM || 'HiddenQueen <hello@brandqueen.de>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('Resend-Versand fehlgeschlagen: ' + res.status + ' ' + body);
  }
  return res.json();
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = { sendMail, esc };
