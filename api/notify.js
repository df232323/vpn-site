// api/notify.js
// Node 18+ (Vercel) — используем глобальный fetch, без node-fetch.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!BOT_TOKEN || !CHAT_ID) {
      res.status(500).json({ error: 'Telegram env vars not configured' });
      return;
    }

    // Парсим тело
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const username = (body.username || '').toString().replace(/[^0-9A-Za-z_]/g,'').trim();
    const plan = (body.plan || '').toString();
    const coupon = (body.coupon || '').toString();
    const time = new Date().toISOString();

    if (!username) {
      res.status(400).json({ error: 'username is required' });
      return;
    }

    const ip =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      '';

    const escapeMd = (s='') => s.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');

    const text =
`📥 *Новая заявка на скачивание*
*Telegram:* @${escapeMd(username)}
*Тариф:* ${escapeMd(plan)}
*Купон:* \`${escapeMd(coupon)}\`
*IP:* \`${escapeMd(ip)}\`
*Дата:* ${escapeMd(time)}`;

    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    };

    const r = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const tgRes = await r.json().catch(() => ({}));

    if (!r.ok || tgRes.ok === false) {
      res.status(502).json({ error: 'Failed to send message to Telegram', details: tgRes });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('notify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
