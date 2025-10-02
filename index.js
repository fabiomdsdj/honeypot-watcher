// tools/honeypot-listener.js
const Redis = require('ioredis');
const fetch = require('node-fetch');

const redis = new Redis(process.env.REDIS_URL);
const SLACK_HOOK = process.env.SLACK_HOOK;

// Cria um canal de "honeypot-events"
const CHANNEL = 'honeypot:events_channel';

redis.subscribe(CHANNEL, (err, count) => {
  if (err) console.error('Erro ao se inscrever no canal:', err);
  else console.log(`Inscrito no canal ${CHANNEL}, total de canais: ${count}`);
});

redis.on('message', async (channel, message) => {
  try {
    if (channel !== CHANNEL) return;
    const event = JSON.parse(message);
    console.log('Novo honeypot detectado:', event);

    if (SLACK_HOOK) {
      await fetch(SLACK_HOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `HONEYPOT: ${event.ip} ${event.path} ${event.ua}` })
      });
    }
  } catch (e) {
    console.error('Erro ao processar evento honeypot:', e);
  }
});
