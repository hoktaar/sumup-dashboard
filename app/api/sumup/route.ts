import { NextResponse } from "next/server";

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_TTL_EMP = 4 * 7 * 24 * 60 * 60 * 1000;  // 4 weeks for employee names
const POLL_INTERVAL  = 5 * 60 * 1000;                 // 5 minutes between new-tx polls

interface EmpCacheEntry {
  data: Record<string, string>;
  expiresAt: number;
}

// Persistent transaction store: cacheKey → all known transactions
const txStore = new Map<string, SumUpTransaction[]>();
// Track last poll time per cacheKey
const txLastPoll = new Map<string, number>();
// Track latest timestamp per (accountId, date-range-key) to fetch only new ones
const txLatestTs = new Map<string, string>();

const empCache = new Map<string, EmpCacheEntry>();

function getEmpCached(key: string): Record<string, string> | null {
  const entry = empCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { empCache.delete(key); return null; }
  return entry.data;
}

function setEmpCached(key: string, data: Record<string, string>) {
  empCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_EMP });
}

function needsPoll(cacheKey: string): boolean {
  const last = txLastPoll.get(cacheKey) ?? 0;
  return Date.now() - last > POLL_INTERVAL;
}

export interface SumUpTransaction {
  id: string;
  transaction_code: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: string;
  payment_type: string;
  product_summary?: string;
  operator?: string;
  location?: string;
  user?: string;
  card_type?: string;
  entry_mode?: string;
  accountId: 1 | 2 | 3;
}

interface SumUpApiTransaction {
  id: string;
  transaction_code: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: string;
  payment_type: string;
  product_summary?: string;
  user?: string;
  card_type?: string;
  entry_mode?: string;
}

interface SumUpAccount {
  id: number;
  username: string;
  nickname: string | null;
  account_type: string;
  disabled: boolean;
}

function parseProductSummary(summary?: string): { operator?: string; location?: string } {
  if (!summary) return {};
  const parts = summary.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    return { location: parts[0], operator: parts[parts.length - 1] };
  }
  return {};
}

// SUMUP_LOCATION_1=email:Name, SUMUP_LOCATION_2=email:Name, ...
function getLocationEnvOverrides(): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (let i = 1; i <= 20; i++) {
    const raw = process.env[`SUMUP_LOCATION_${i}`];
    if (!raw) continue;
    const sep = raw.indexOf(":");
    if (sep === -1) continue;
    const email = raw.slice(0, sep).trim().toLowerCase();
    const name = raw.slice(sep + 1).trim();
    if (email && name) overrides[email] = name;
  }
  return overrides;
}

async function fetchEmployeeAccounts(apiKey: string): Promise<Record<string, string>> {
  const cached = getEmpCached(apiKey);
  if (cached) return cached;

  // Always start with env overrides — these take priority
  const overrides = getLocationEnvOverrides();

  try {
    const res = await fetch("https://api.sumup.com/v0.1/me/accounts", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) { setEmpCached(apiKey, overrides); return overrides; }
    const accounts: SumUpAccount[] = await res.json();
    // Merge: env overrides win over API data
    const map: Record<string, string> = { ...overrides };
    for (const acc of accounts) {
      const key = acc.username.toLowerCase();
      if (!map[key]) {
        map[key] = acc.nickname ?? acc.username;
      }
    }
    setEmpCached(apiKey, map);
    return map;
  } catch {
    setEmpCached(apiKey, overrides);
    return overrides;
  }
}

interface SumUpApiResponse {
  items?: SumUpApiTransaction[];
  transactions?: SumUpApiTransaction[];
}

async function fetchFromApi(
  apiKey: string,
  accountId: 1 | 2 | 3,
  qs: URLSearchParams
): Promise<SumUpTransaction[]> {
  const PAGE_LIMIT = 1000;
  qs.set("limit", String(PAGE_LIMIT));
  const all: SumUpTransaction[] = [];

  // Paginate until we get fewer results than the page limit
  while (true) {
    const url = `https://api.sumup.com/v0.1/me/transactions/history?${qs.toString()}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`SumUp API error for account ${accountId}: ${response.status} ${response.statusText}`);
      break;
    }
    const data: SumUpApiResponse = await response.json();
    const items: SumUpApiTransaction[] = data.items ?? data.transactions ?? [];
    const mapped = items.map((tx) => ({ ...tx, ...parseProductSummary(tx.product_summary), accountId }));
    all.push(...mapped);
    // If fewer than PAGE_LIMIT returned, we have all pages
    if (items.length < PAGE_LIMIT) break;
    // Next page: use oldest timestamp from this batch as newest_time for next request
    const oldest = items[items.length - 1].timestamp;
    if (!oldest) break;
    qs.set("newest_time", new Date(new Date(oldest).getTime() - 1).toISOString());
  }

  return all;
}

async function fetchTransactions(
  apiKey: string,
  accountId: 1 | 2 | 3,
  params: { start_date?: string; end_date?: string; limit?: string }
): Promise<SumUpTransaction[]> {
  const rangeKey = `${accountId}:${params.start_date ?? ""}:${params.end_date ?? ""}`;
  const existing = txStore.get(rangeKey);

  if (existing && !needsPoll(rangeKey)) {
    return existing;
  }

  if (existing) {
    // Poll only for new transactions since the latest known timestamp
    const latestTs = txLatestTs.get(rangeKey);
    const qs = new URLSearchParams();
    qs.set("limit", "500");
    if (latestTs) {
      // fetch anything newer than the latest known tx
      const newestTime = new Date(new Date(latestTs).getTime() + 1).toISOString();
      qs.set("oldest_time", newestTime);
    }
    if (params.end_date) qs.set("newest_time", `${params.end_date}T23:59:59.999Z`);

    const newTx = await fetchFromApi(apiKey, accountId, qs);
    txLastPoll.set(rangeKey, Date.now());

    if (newTx.length > 0) {
      // Merge: deduplicate by transaction_code
      const knownCodes = new Set(existing.map((t) => t.transaction_code));
      const merged = [...existing, ...newTx.filter((t) => !knownCodes.has(t.transaction_code))];
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      txStore.set(rangeKey, merged);
      // Update latest timestamp
      const latest = merged[0]?.timestamp;
      if (latest) txLatestTs.set(rangeKey, latest);
    }
    return txStore.get(rangeKey)!;
  }

  // First load: fetch full range
  const qs = new URLSearchParams();
  qs.set("limit", params.limit ?? "500");
  if (params.start_date) qs.set("oldest_time", `${params.start_date}T00:00:00.000Z`);
  if (params.end_date) qs.set("newest_time", `${params.end_date}T23:59:59.999Z`);

  const result = await fetchFromApi(apiKey, accountId, qs);
  txStore.set(rangeKey, result);
  txLastPoll.set(rangeKey, Date.now());
  const latest = result[0]?.timestamp;
  if (latest) txLatestTs.set(rangeKey, latest);
  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = {
    start_date: searchParams.get("start_date") ?? undefined,
    end_date: searchParams.get("end_date") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  };

  const keys = [
    process.env.SUMUP_API_KEY_1,
    process.env.SUMUP_API_KEY_2,
    process.env.SUMUP_API_KEY_3,
  ] as const;

  const missing = keys.some((k) => !k);
  if (missing) {
    return NextResponse.json(
      { error: "One or more SumUp API keys are not configured." },
      { status: 500 }
    );
  }

  const [account1, account2, account3, employees1, employees2, employees3] = await Promise.all([
    fetchTransactions(keys[0]!, 1, params),
    fetchTransactions(keys[1]!, 2, params),
    fetchTransactions(keys[2]!, 3, params),
    fetchEmployeeAccounts(keys[0]!),
    fetchEmployeeAccounts(keys[1]!),
    fetchEmployeeAccounts(keys[2]!),
  ]);

  const all: SumUpTransaction[] = [...account1, ...account2, ...account3].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const accountNames = {
    1: process.env.SUMUP_ACCOUNT_NAME_1 ?? "Konto 1",
    2: process.env.SUMUP_ACCOUNT_NAME_2 ?? "Konto 2",
    3: process.env.SUMUP_ACCOUNT_NAME_3 ?? "Konto 3",
  };

  // Merge employee maps from all accounts, prefixed with account id to avoid collisions
  const employeeNames: Record<string, string> = {
    ...Object.fromEntries(Object.entries(employees1).map(([k, v]) => [k, v])),
    ...Object.fromEntries(Object.entries(employees2).map(([k, v]) => [k, v])),
    ...Object.fromEntries(Object.entries(employees3).map(([k, v]) => [k, v])),
  };

  return NextResponse.json(
    { transactions: all, accountNames, employeeNames },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
