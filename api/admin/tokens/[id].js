const fs = require('fs');
const path = require('path');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const TOKENS_PATH = path.join(process.cwd(), 'data/tokens.json');

function readTokens() {
  return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
}
function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

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
    const tokens = readTokens();
    if (!tokens[id]) {
      res.status(404).json({ error: 'Token niet gevonden' });
      return;
    }
    tokens[id].status = status;
    writeTokens(tokens);
    res.status(200).json({ id, status });
  } else {
    res.setHeader('Allow', 'PATCH');
    res.status(405).end('Method Not Allowed');
  }
}; 