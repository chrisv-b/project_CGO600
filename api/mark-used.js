import { Redis } from '@upstash/redis';
const rateLimit = require('./rate-limit').default || require('./rate-limit');

const redis = Redis.fromEnv();

module.exports = async (req, res) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'TENWAYS.LINKPC.NET');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Rate limiting
  if (!rateLimit(req, res)) return;

  // Echte authenticatie: check op API-token
  const authHeader = req.headers['authorization'];
  const token = process.env.INSTALL_TOKEN;
  if (!authHeader || authHeader !== `Bearer ${token}`) {
    res.status(403).json({ error: 'Niet geautoriseerd' });
    return;
  }

  try {
    const { code } = req.query;

    // Validate input
    if (!code) {
      return res.status(400).json({ 
        error: 'Activatiecode is vereist',
        success: false 
      });
    }

    // Check if code is valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(code)) {
      return res.status(400).json({ 
        error: 'Ongeldige activatiecode formaat',
        success: false 
      });
    }

    // Get token from Redis
    const tokenRaw = await redis.hget('tokens', code);
    if (!tokenRaw) {
      return res.status(404).json({ 
        error: 'Activatiecode niet gevonden',
        success: false 
      });
    }
    const tokenData = JSON.parse(tokenRaw);

    // Check if token is already used
    if (tokenData.status === 'gebruikt') {
      return res.status(200).json({ 
        message: 'Activatiecode was al gemarkeerd als gebruikt',
        success: true 
      });
    }

    // Mark token as used
    tokenData.status = 'gebruikt';
    tokenData.gebruikt_op = new Date().toISOString();
    tokenData.ip_gebruikt = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await redis.hset('tokens', { [code]: JSON.stringify(tokenData) });

    // Logging
    console.log(`[${new Date().toISOString()}] Activatiecode gemarkeerd als gebruikt door ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);

    res.status(200).json({ 
      message: 'Activatiecode gemarkeerd als gebruikt',
      success: true 
    });

  } catch (error) {
    console.error('Error marking code as used:', error);
    res.status(500).json({ 
      error: 'Interne serverfout',
      success: false 
    });
  }
}; 