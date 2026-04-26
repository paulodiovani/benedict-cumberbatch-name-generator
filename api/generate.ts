import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generate, mapError } from '../lib/llm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const name = await generate();
    return res.status(200).json(name);
  } catch (err) {
    console.error('[api/generate]', err);
    const { status, message } = mapError(err);
    return res.status(status).json({ message });
  }
}
