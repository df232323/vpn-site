// api/notify.js
// Vercel serverless function (Node.js) — accepts POST with { username, plan, coupon }
// and sends a formatted message to Telegram chat.

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Telegram env vars not configured' }));
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const username = (body.username || '').toString().replace(/[^0-9A-Za-z_]/g,'').trim();
    const plan = (body.plan || '').toString();
    const coupon = (body.coupon || '').toString();
    const time = new Date().toISOString();

    if (!username) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'username is required' }));
    }

    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';

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

    const tgRes = await r.json();

    if (!r.ok || !tgRes.ok) {
      console.error('Telegram error', tgRes);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Failed to send message to Telegram', details: tgRes }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Server error' }));
  }
}
