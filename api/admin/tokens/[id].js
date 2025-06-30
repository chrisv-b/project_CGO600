const { db } = require('../../../lib/firebase');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

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
    await db.collection('tokens').doc(id).update({ status });
    res.status(200).json({ id, status });
  } else {
    res.setHeader('Allow', 'PATCH');
    res.status(405).end('Method Not Allowed');
  }
}; 