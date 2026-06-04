import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { generate, mapError } from './lib/llm';

const PORT = parseInt(process.env.PORT ?? '7860', 10);
const DIST_DIR = join(__dirname, '..', 'dist');
const PUBLIC_DIR = join(__dirname, '..', 'public');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendFile(res: ServerResponse, filePath: string) {
  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

function serveStatic(res: ServerResponse, pathname: string) {
  const distPath = join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  if (existsSync(distPath) && statSync(distPath).isFile()) {
    sendFile(res, distPath);
    return;
  }

  const publicPath = join(PUBLIC_DIR, pathname);
  if (existsSync(publicPath) && statSync(publicPath).isFile()) {
    sendFile(res, publicPath);
    return;
  }

  const fallbackPath = join(DIST_DIR, 'index.html');
  if (existsSync(fallbackPath)) {
    sendFile(res, fallbackPath);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/api/generate') {
    if (req.method !== 'GET') {
      return sendJson(res, 405, { message: 'Method not allowed' });
    }
    try {
      const name = await generate();
      return sendJson(res, 200, name);
    } catch (err) {
      console.error('[api/generate]', err);
      const { status, message } = mapError(err);
      return sendJson(res, status, { message });
    }
  }

  serveStatic(res, pathname);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
