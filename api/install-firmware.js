const fs = require('fs');
const path = require('path');

// Voorbeeld authenticatie-middleware (vervang door echte implementatie)
function isAuthenticated(req) {
  // TODO: Implementeer echte authenticatie
  // Bijvoorbeeld: return req.headers['authorization'] === 'Bearer jouw-token';
  return true;
}

module.exports = async (req, res) => {
  // Beveiligingsheaders
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Echte authenticatie: check op API-token
  const authHeader = req.headers['authorization'];
  const token = process.env.INSTALL_TOKEN;
  if (!authHeader || authHeader !== `Bearer ${token}`) {
    res.status(403).json({ error: 'Niet geautoriseerd' });
    return;
  }

  const firmwarePath = path.join(process.cwd(), 'lib/firmware.bin');
  if (!fs.existsSync(firmwarePath)) {
    res.status(404).json({ error: 'Firmware niet gevonden' });
    return;
  }

  // Logging
  console.log(`[${new Date().toISOString()}] Firmware installatie gestart door ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);

  res.setHeader('Content-Type', 'application/octet-stream');
  // Geen Content-Disposition: attachment, dus geen download!

  const stream = fs.createReadStream(firmwarePath);
  stream.pipe(res);
}; 