const fs = require('fs');
const path = require('path');
const rateLimit = require('./rate-limit').default || require('./rate-limit');

const TOKENS_PATH = path.join(process.cwd(), 'data/tokens.json');

function readTokens() {
  return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
}
function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

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

    // Get token from file
    const tokens = readTokens();
    const tokenData = tokens[code];

    if (!tokenData) {
      return res.status(404).json({ 
        error: 'Activatiecode niet gevonden',
        success: false 
      });
    }

    // Check if token is already used
    if (tokenData.status === 'gebruikt') {
      return res.status(200).json({ 
        message: 'Activatiecode was al gemarkeerd als gebruikt',
        success: true 
      });
    }

    // Mark token as used
    tokens[code].status = 'gebruikt';
    tokens[code].gebruikt_op = new Date().toISOString();
    tokens[code].ip_gebruikt = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    writeTokens(tokens);

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