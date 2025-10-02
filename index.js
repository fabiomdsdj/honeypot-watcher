// worker.js
import Redis from 'ioredis';
import fetch from 'node-fetch';

const redis = new Redis(process.env.REDIS_URL);
const SLACK_HOOK = process.env.SLACK_HOOK;
const CHANNEL = 'honeypot:events_channel';

// Assina o canal pub/sub do Redis
redis.subscribe(CHANNEL, (err, count) => {
  if (err) {
    console.error('❌ Erro ao se inscrever no canal:', err);
  } else {
    console.log(`✅ Worker inscrito no canal ${CHANNEL} (${count} canal)`);
  }
});

// Processa mensagens em tempo real
redis.on('message', async (channel, message) => {
  if (channel !== CHANNEL) return;
  try {
    const event = JSON.parse(message);
    console.log('🚨 Novo honeypot detectado:', event);

    if (SLACK_HOOK) {
      await fetch(SLACK_HOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *HONEYPOT DETECTADO* 🚨\nIP: ${event.ip}\nPATH: ${event.path}\nUA: ${event.ua}`,
        }),
      });
    }
  } catch (e) {
    console.error('Erro ao processar evento honeypot:', e);
  }
});

