import type { IncomingMessage, ServerResponse } from 'node:http';
import { generate, mapError } from '../lib/llm';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Method not allowed' }));
  }
  try {
    const name = await generate();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(name));
  } catch (err) {
    console.error('[api/generate]', err);
    const { status, message } = mapError(err);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message }));
  }
}
