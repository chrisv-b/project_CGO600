// Eenvoudige rate limiting middleware voor Vercel serverless functions
// Gebruik: importeren en als eerste aanroepen in je API handler

let requests = {};
const WINDOW_SIZE = 60 * 1000; // 1 minuut
const MAX_REQUESTS = 30; // max 30 requests per minuut per IP

export default function rateLimit(req, res) {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const now = Date.now();
  if (!requests[ip]) requests[ip] = [];
  // Verwijder oude requests
  requests[ip] = requests[ip].filter(ts => now - ts < WINDOW_SIZE);
  if (requests[ip].length >= MAX_REQUESTS) {
    res.status(429).json({ error: "Te veel verzoeken, probeer het later opnieuw." });
    return false;
  }
  requests[ip].push(now);
  return true;
} 