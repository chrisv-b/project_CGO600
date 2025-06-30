import { Redis } from '@upstash/redis';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    res.status(403).json({ error: 'Niet geautoriseerd' });
    return;
  }

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is vereist' });
      return;
    }
    const tokenRaw = await redis.hget('tokens', id);
    if (!tokenRaw) {
      res.status(404).json({ error: 'Token niet gevonden' });
      return;
    }
    const token = JSON.parse(tokenRaw);
    token.status = status;
    await redis.hset('tokens', { [id]: JSON.stringify(token) });
    res.status(200).json({ id, status });
  } else {
    res.setHeader('Allow', 'PATCH');
    res.status(405).end('Method Not Allowed');
  }
}; 