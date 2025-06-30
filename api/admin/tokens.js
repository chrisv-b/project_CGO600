import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const redis = Redis.fromEnv();

function generateShortCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Geen O/0, I/1, l
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = async (req, res) => {
  // Eenvoudige admin authenticatie
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    res.status(403).json({ error: 'Niet geautoriseerd' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Haal alle tokens op
    const tokens = await redis.hgetall('tokens');
    const result = Object.entries(tokens || {}).map(([id, data]) => ({ id, ...JSON.parse(data) }));
    res.status(200).json(result);
  } else if (req.method === 'POST') {
    // Maak een nieuwe token aan
    let code;
    let exists = true;
    // Zorg dat de code uniek is
    while (exists) {
      code = generateShortCode(8);
      const existing = await redis.hget('tokens', code);
      exists = !!existing;
    }
    const data = { status: 'nieuw', aangemaakt_op: new Date().toISOString() };
    await redis.hset('tokens', { [code]: JSON.stringify(data) });
    res.status(201).json({ id: code, status: 'nieuw' });
  } else {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).end('Method Not Allowed');
  }
}; 