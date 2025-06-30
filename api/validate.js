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

    const tokens = readTokens();
    const tokenData = tokens[code];

    if (!tokenData) {
      return res.status(404).json({ 
        error: 'Activatiecode niet gevonden',
        success: false 
      });
    }

    // Check token status
    if (tokenData.status === 'gebruikt') {
      return res.status(403).json({ 
        error: 'Deze activatiecode is al gebruikt',
        success: false 
      });
    }

    if (tokenData.status === 'in-gebruik') {
      return res.status(409).json({ 
        error: 'Deze activatiecode wordt momenteel gebruikt',
        success: false 
      });
    }

    // Update status to 'in-gebruik' and add usage timestamp
    tokens[code].status = 'in-gebruik';
    tokens[code].in_gebruik_op = new Date().toISOString();
    tokens[code].ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    writeTokens(tokens);

    res.status(200).json({
      success: true,
      message: 'Activatiecode geldig',
      code: code
    });

  } catch (error) {
    console.error('Error validating code:', error);
    res.status(500).json({ 
      error: 'Interne serverfout',
      success: false 
    });
  }
}; 