import { NextRequest, NextResponse } from 'next/server';
import { chatWithAssistant } from '@/lib/ai/claude';
import type { ChatMessage } from '@/lib/ai/claude';
import { sendEscalationEmail } from '@/lib/email/resend';
import { rateLimit } from '@/lib/rateLimit';
import { SITE } from '@/lib/config/site';

export const runtime = 'nodejs';

const SUPPORT_EMAIL_MARKER = SITE.supportEmail;
const MAX_MSG_LENGTH = 2000;
const VALID_ROLES = new Set(['user', 'assistant']);

const PASSWORD_CONTEXT = /password|contraseña|log ?in|reset|sign ?in/i;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;

/**
 * Account email shared in the LATEST user message of a password/login
 * conversation, if any. There is no chat_sessions table to dedupe against,
 * so only the message that introduces the email triggers an escalation.
 */
function extractPasswordHelpEmail(messages: ChatMessage[]): string | null {
  const hasPasswordContext = messages.some((m) => PASSWORD_CONTEXT.test(m.content));
  if (!hasPasswordContext) return null;
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const match = lastUser?.content.match(EMAIL_PATTERN);
  return match ? match[0] : null;
}

export async function POST(req: NextRequest) {
  // Rate limit: 20 messages per minute per IP
  const rl = rateLimit(req, { limit: 20, windowMs: 60_000, prefix: 'chat' });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before sending more messages.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const body = await req.json() as { messages: ChatMessage[]; sessionId?: string };
    const { messages } = body;
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : undefined;

    // Validate messages array structure and content length
    if (
      !messages ||
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 40 ||
      messages.some(
        (m) =>
          typeof m?.content !== 'string' ||
          !VALID_ROLES.has(m?.role) ||
          m.content.length > MAX_MSG_LENGTH
      )
    ) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Limit conversation history to last 10 messages to control token usage
    const recent = messages.slice(-10);
    const reply = await chatWithAssistant(recent);

    // ── Escalation (stateless — no chat_sessions table) ───────────────────
    // 1. Password reset: the user just shared their account email in a
    //    password/login conversation. Fires once, on the message that
    //    introduces the email.
    // 2. Support handoff: the reply mentions the support address for the
    //    FIRST time in this conversation (prior assistant turns are checked
    //    to avoid duplicate emails across follow-up messages).
    const allMessages = [...recent, { role: 'assistant' as const, content: reply }];
    const passwordHelpEmail = extractPasswordHelpEmail(allMessages);
    const firstSupportMention =
      reply.includes(SUPPORT_EMAIL_MARKER) &&
      !recent.some((m) => m.role === 'assistant' && m.content.includes(SUPPORT_EMAIL_MARKER));

    if (passwordHelpEmail || firstSupportMention) {
      // Awaited — Vercel freezes the function after the response returns,
      // killing any in-flight promises.
      await sendEscalationEmail({
        sessionId,
        messages: allMessages,
        userEmail: passwordHelpEmail ?? undefined,
      }).catch((err) => console.error('[chat] escalation email error:', err));
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[chat] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
