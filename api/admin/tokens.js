import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const redis = Redis.fromEnv();

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
    const code = uuidv4();
    const data = { status: 'nieuw', aangemaakt_op: new Date().toISOString() };
    await redis.hset('tokens', { [code]: JSON.stringify(data) });
    res.status(201).json({ id: code, status: 'nieuw' });
  } else {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).end('Method Not Allowed');
  }
}; 