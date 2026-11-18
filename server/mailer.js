// Отправка писем через HTTP API Resend.
// SDK не нужен: обычный fetch, поэтому в server/package.json ничего не добавляется.
// Без RESEND_API_KEY письма не отправляются — сброс пароля в этом случае отвечает 503.

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// onboarding@resend.dev работает только для писем на свой аккаунт Resend;
// для реальных адресов нужен свой проверенный домен в MAIL_FROM.
const MAIL_FROM = process.env.MAIL_FROM || 'CRM <onboarding@resend.dev>';

// Настроена ли отправка писем на сервере
export const isMailConfigured = () => Boolean(RESEND_API_KEY);

/**
 * Отправляет письмо.
 * @param {{ to: string, subject: string, html: string, text?: string }} message
 * @returns {Promise<object>} ответ Resend с id письма
 */
export async function sendMail({ to, subject, html, text }) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY не задан');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Resend отвечает 403 (code 1010) на запросы без User-Agent
      'User-Agent': 'crm-server/1.0',
    },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json();
}
