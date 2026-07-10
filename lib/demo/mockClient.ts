/**
 * lib/demo/mockClient.ts — FitBodega
 * A minimal in-memory stand-in for the Supabase client, used when no
 * NEXT_PUBLIC_SUPABASE_URL is configured (local design preview).
 *
 * Implements the thenable query-builder surface the app actually uses
 * (select / eq / neq / not / in / or / ilike / contains / order / limit /
 * range / single / maybeSingle). Unknown filter methods are chainable
 * no-ops so new call sites degrade gracefully instead of crashing.
 */
import { DEMO_LISTINGS } from "./listings";
import { DEMO_BLOG_POSTS } from "./blog";

type Row = Record<string, any>;

const TABLES: Record<string, Row[]> = {
  listings: DEMO_LISTINGS as unknown as Row[],
  blog_posts: DEMO_BLOG_POSTS as unknown as Row[],
  reviews: [],
  newsletter_subscribers: [],
  leads: [],
  profiles: [],
};

class MockQuery implements PromiseLike<{ data: any; error: null; count: number | null }> {
  private rows: Row[];
  private isSingle = false;
  private isMaybeSingle = false;
  private headOnly = false;
  private start = 0;
  private end: number | null = null;

  constructor(table: string) {
    this.rows = [...(TABLES[table] ?? [])];
  }

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (opts?.head) this.headOnly = true;
    return this;
  }

  eq(col: string, val: any) { this.rows = this.rows.filter(r => r[col] === val); return this; }
  neq(col: string, val: any) { this.rows = this.rows.filter(r => r[col] !== val); return this; }
  in(col: string, vals: any[]) { this.rows = this.rows.filter(r => vals.includes(r[col])); return this; }
  gt(col: string, val: any) { this.rows = this.rows.filter(r => r[col] > val); return this; }
  gte(col: string, val: any) { this.rows = this.rows.filter(r => r[col] >= val); return this; }
  lt(col: string, val: any) { this.rows = this.rows.filter(r => r[col] < val); return this; }
  lte(col: string, val: any) { this.rows = this.rows.filter(r => r[col] <= val); return this; }

  not(col: string, op: string, val: any) {
    if (op === "is" && val === null) this.rows = this.rows.filter(r => r[col] !== null && r[col] !== undefined);
    return this;
  }

  ilike(col: string, pattern: string) {
    const needle = pattern.replace(/%/g, "").toLowerCase();
    this.rows = this.rows.filter(r => String(r[col] ?? "").toLowerCase().includes(needle));
    return this;
  }

  contains(col: string, vals: any[]) {
    this.rows = this.rows.filter(r => Array.isArray(r[col]) && vals.every(v => r[col].includes(v)));
    return this;
  }

  overlaps(col: string, vals: any[]) {
    this.rows = this.rows.filter(r => Array.isArray(r[col]) && vals.some(v => r[col].includes(v)));
    return this;
  }

  /** Supabase `.or("a.ilike.%x%,b.ilike.%x%")` — supports ilike/eq terms. */
  or(expr: string) {
    const terms = expr.split(",").map(t => t.split("."));
    this.rows = this.rows.filter(r =>
      terms.some(([col, op, ...rest]) => {
        const val = rest.join(".");
        if (op === "ilike") return String(r[col] ?? "").toLowerCase().includes(val.replace(/%/g, "").toLowerCase());
        if (op === "eq") return String(r[col]) === val;
        return false;
      })
    );
    return this;
  }

  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    const asc = opts?.ascending !== false;
    this.rows.sort((a, b) => {
      const av = a[col], bv = b[col];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av < bv ? -1 : 1) * (asc ? 1 : -1);
    });
    return this;
  }

  limit(n: number) { this.end = this.start + n; return this; }
  range(from: number, to: number) { this.start = from; this.end = to + 1; return this; }
  single() { this.isSingle = true; return this; }
  maybeSingle() { this.isMaybeSingle = true; return this; }

  // Writes are no-ops in demo mode — return the input so optimistic UIs work.
  insert(rows: Row | Row[]) { return new MockMutation(rows); }
  update(_values: Row) { return new MockMutation([]); }
  upsert(rows: Row | Row[]) { return new MockMutation(rows); }
  delete() { return new MockMutation([]); }

  private result() {
    const count = this.rows.length;
    if (this.headOnly) return { data: null, error: null as null, count };
    const sliced = this.end !== null ? this.rows.slice(this.start, this.end) : this.rows.slice(this.start);
    if (this.isSingle || this.isMaybeSingle) {
      const row = sliced[0] ?? null;
      if (!row && this.isSingle) {
        return { data: null, error: { message: "Row not found", code: "PGRST116" } as any, count };
      }
      return { data: row, error: null as null, count };
    }
    return { data: sliced, error: null as null, count };
  }

  then<T1 = any, T2 = never>(
    onfulfilled?: ((value: any) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null,
  ) {
    return Promise.resolve(this.result()).then(onfulfilled, onrejected);
  }
}

class MockMutation implements PromiseLike<{ data: any; error: null }> {
  constructor(private rows: Row | Row[]) {}
  select() { return this; }
  single() { return this; }
  then<T1 = any, T2 = never>(
    onfulfilled?: ((value: any) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null,
  ) {
    const data = Array.isArray(this.rows) ? this.rows : [this.rows];
    return Promise.resolve({ data: data[0] ?? null, error: null }).then(onfulfilled, onrejected);
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";

export function createMockClient(): SupabaseClient {
  return {
    from(table: string) { return new MockQuery(table); },
    auth: {
      async getUser() { return { data: { user: null }, error: null }; },
      async getSession() { return { data: { session: null }, error: null }; },
      async signOut() { return { error: null }; },
      async signInWithPassword() { return { data: { user: null, session: null }, error: { message: "Demo mode — no database configured" } }; },
      async signUp() { return { data: { user: null, session: null }, error: { message: "Demo mode — no database configured" } }; },
      async resetPasswordForEmail() { return { data: {}, error: null }; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
    },
    storage: {
      from() {
        return {
          getPublicUrl(path: string) { return { data: { publicUrl: `/demo/${path}` } }; },
          async upload() { return { data: null, error: { message: "Demo mode" } }; },
        };
      },
    },
  } as unknown as SupabaseClient;
}

export const isDemoMode = () => !process.env.NEXT_PUBLIC_SUPABASE_URL;
