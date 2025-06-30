const { db } = require('../../lib/firebase');
const { v4: uuidv4 } = require('uuid');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

module.exports = async (req, res) => {
  // Eenvoudige admin authenticatie
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    res.status(403).json({ error: 'Niet geautoriseerd' });
    return;
  }

  if (req.method === 'GET') {
    // Haal alle tokens op
    const snapshot = await db.collection('tokens').get();
    const tokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(tokens);
  } else if (req.method === 'POST') {
    // Maak een nieuwe token aan
    const code = uuidv4();
    await db.collection('tokens').doc(code).set({
      status: 'nieuw',
      aangemaakt_op: new Date()
    });
    res.status(201).json({ id: code, status: 'nieuw' });
  } else {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).end('Method Not Allowed');
  }
}; 