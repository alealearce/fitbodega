/**
 * botGate.ts — server side of the bot gate on the open forms (signup,
 * newsletter, Deal Radar).
 *
 * In Aug-Sep 2026 bots pushed hundreds of strangers' addresses through these
 * forms ("subscription bombing": the victim's inbox floods so they miss a fraud
 * alert). Every one made us send a confirmation email to someone who never
 * asked. The per-IP rate limit did not stop it; the bots rotate addresses.
 *
 * A submission passes when:
 *   - the honeypot field `company` is empty (people never see it, bots fill it),
 *   - `gate_token` is one we signed when the form loaded, at least MIN_FILL_MS
 *     old (nobody types an email in under ~2 seconds) and under a day old.
 * A refused bot must get the same response a person gets, so it learns nothing.
 * Client side: components/BotGate.tsx.
 */
import { createHmac, timingSafeEqual } from 'crypto';

const MIN_FILL_MS = 2500;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

const secret = () => process.env.BOT_GATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sign = (ts: string) => createHmac('sha256', secret()).update(`bot-gate:${ts}`).digest('hex');

export function issueGateToken(): string {
  if (!secret()) return '';
  const ts = String(Date.now());
  return `${ts}.${sign(ts)}`;
}

export type GateVerdict = 'ok' | 'honeypot' | 'token' | 'fast' | 'stale';

export function checkGate(body: unknown): GateVerdict {
  // No secret configured: the gate cannot sign anything, so let people through
  // rather than lock every form.
  if (!secret()) return 'ok';
  const { gate_token: token, company } = (body ?? {}) as { gate_token?: unknown; company?: unknown };
  if (typeof company === 'string' && company.trim() !== '') return 'honeypot';
  if (typeof token !== 'string') return 'token';
  const [ts, mac] = token.split('.');
  if (!ts || !mac || !/^\d{10,}$/.test(ts)) return 'token';
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return 'token';
  const age = Date.now() - Number(ts);
  if (age < MIN_FILL_MS) return 'fast';
  if (age > MAX_AGE_MS) return 'stale';
  return 'ok';
}

/** True when the submission should be dropped. Logs why, never says so to the caller. */
export function refusedByGate(body: unknown, form: string): boolean {
  const verdict = checkGate(body);
  if (verdict === 'ok') return false;
  console.warn(`[bot-gate] ${form}: refused (${verdict})`);
  return true;
}
