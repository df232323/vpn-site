const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }
    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ ok: false, error: 'Telegram env vars not configured' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const username = (body.username || '').toString().replace(/[^0-9A-Za-z_]/g,'').trim();
    const plan = (body.plan || '').toString();
    const coupon = (body.coupon || '').toString();
    if (!username) return res.status(400).json({ ok:false, error:'username is required' });

    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    const time = new Date().toISOString();

    const text =
`🆕Новая заявка на скачивание

🌐Telegram: @${username}
📱Тариф: ${plan}
🎟Купон: ${coupon}
🔑IP: ${ip}
🕚Дата: ${time}`;

    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true })
    });

    let tg = {};
    try { tg = await r.json(); } catch {}
    if (!r.ok || tg.ok === false) {
      return res.status(502).json({ ok:false, error:'Failed to send to Telegram', details: tg });
    }
    return res.status(200).json({ ok:true });
  } catch (e) {
    console.error('notify error:', e);
    return res.status(500).json({ ok:false, error:'Server error' });
  }
}
