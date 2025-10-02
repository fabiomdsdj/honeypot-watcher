// api/honeypot-listener.js
import Redis from 'ioredis';
import fetch from 'node-fetch';

const redis = new Redis(process.env.REDIS_URL);
const SLACK_HOOK = process.env.SLACK_HOOK;

export default async function handler(req, res) {
  try {
    // pega até 10 eventos pendentes
    const items = await redis.lrange('honeypot:events', 0, 9);
    if (!items || items.length === 0) {
      return res.status(200).json({ msg: 'No events' });
    }

    for (const item of items) {
      const event = JSON.parse(item);
      console.log('Honeypot event:', event);

      if (SLACK_HOOK) {
        await fetch(SLACK_HOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `HONEYPOT: ${event.ip} ${event.path} ${event.ua}` })
        });
      }
    }

    // limpa os eventos processados
    await redis.ltrim('honeypot:events', items.length, -1);

    res.status(200).json({ processed: items.length });
  } catch (err) {
    console.error('Erro honeypot listener:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}
