import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateShortDescription } from '@/lib/ai/claude';
import { rateLimit } from '@/lib/rateLimit';

const GenerateSchema = z.object({
  name:        z.string().min(2).max(100),
  type:        z.string().min(1).max(60),
  specialties: z.array(z.string().max(60)).max(20).optional(),
  city:        z.string().min(1).max(100),
  country:     z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 10 AI generations per minute per IP
  const rl = rateLimit(req, { limit: 10, windowMs: 60_000, prefix: 'gen-desc' });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before generating again.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { name, type, specialties, city, country } = parsed.data;

    const result = await generateShortDescription({
      name,
      type,
      city,
      country,
      specialties,
    });

    return NextResponse.json({ ok: true, description: result.description });
  } catch (err) {
    console.error('[generate-description] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
