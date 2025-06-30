const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const TOKENS_PATH = path.join(process.cwd(), 'data/tokens.json');

function readTokens() {
  return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
}
function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

module.exports = async (req, res) => {
  // Eenvoudige admin authenticatie
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    res.status(403).json({ error: 'Niet geautoriseerd' });
    return;
  }

  if (req.method === 'GET') {
    // Haal alle tokens op
    const tokens = readTokens();
    const result = Object.entries(tokens).map(([id, data]) => ({ id, ...data }));
    res.status(200).json(result);
  } else if (req.method === 'POST') {
    // Maak een nieuwe token aan
    const code = uuidv4();
    const tokens = readTokens();
    tokens[code] = { status: 'nieuw', aangemaakt_op: new Date().toISOString() };
    writeTokens(tokens);
    res.status(201).json({ id: code, status: 'nieuw' });
  } else {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).end('Method Not Allowed');
  }
}; 