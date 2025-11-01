#!/usr/bin/env node
// Lightweight development mock for biometric microservice (no dependencies)
// Provides minimal endpoints used by the backend during local development.
import http from 'http';

const PORT = process.env.DEV_BIOMETRIC_PORT || 8000;

function parseJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body) return resolve(null);
      try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  if (req.method === 'GET' && url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', service: 'dev-biometric-mock' }));
    return;
  }

  if (req.method === 'POST' && url === '/api/face/quality-check') {
    try {
      const body = await parseJson(req);
      // Simple heuristic: if image field present, approve; otherwise reject
      const approved = !!(body && (body.image || body.image_data));
      const response = {
        approved,
        details: {
          no_obstructions: true,
          neutral_expression: true,
          proper_lighting: true,
          forward_facing: true,
          no_glasses: true
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ approved: false, error: 'invalid json' }));
    }
    return;
  }

  if (req.method === 'POST' && url === '/api/face/register') {
    try {
      const body = await parseJson(req);
      // Reply with a fake template and encoding
      const resp = {
        success: true,
        data: {
          template_id: `tmpl_${Math.random().toString(36).slice(2,9)}`,
          encoding: `enc_${Math.random().toString(36).slice(2,24)}`
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'invalid json' }));
    }
    return;
  }

  if (req.method === 'POST' && url === '/api/face/verify') {
    try {
      // Accept anything for dev
      const resp = { success: true, score: 0.92 };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(resp));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false }));
    }
    return;
  }

  // default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found in dev mock' }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`dev_biometric_mock listening on http://localhost:${PORT}`);
});

// Allow graceful shutdown
process.on('SIGINT', () => { server.close(() => process.exit(0)); });
