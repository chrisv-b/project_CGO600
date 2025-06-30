const { db } = require('../lib/firebase');
const rateLimit = require('./rate-limit').default || require('./rate-limit');

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

    // Get token from Firestore
    const tokenRef = db.collection('tokens').doc(code);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      return res.status(404).json({ 
        error: 'Activatiecode niet gevonden',
        success: false 
      });
    }

    const tokenData = tokenDoc.data();

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
    await tokenRef.update({
      status: 'in-gebruik',
      in_gebruik_op: new Date(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

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