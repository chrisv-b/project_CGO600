import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // TODO: Voeg echte authenticatie/autoristatie toe!
  // if (!req.user || !req.user.isAuthorized) return res.status(403).end();

  const firmwarePath = path.join(process.cwd(), 'lib/firmware.bin');
  if (!fs.existsSync(firmwarePath)) {
    res.status(404).json({ error: 'Firmware niet gevonden' });
    return;
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  // Geen Content-Disposition: attachment, dus geen download!

  const stream = fs.createReadStream(firmwarePath);
  stream.pipe(res);
} 