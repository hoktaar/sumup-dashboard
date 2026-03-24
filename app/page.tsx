"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Building2,
  Filter,
  X,
  Calendar,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import React from "react";
import type { SumUpTransaction } from "./api/sumup/route";

// ── helpers ──────────────────────────────────────────────────────────────────

function CardTypeBadge({ cardType, entryMode }: { cardType: string; entryMode?: string }) {
  const type = cardType.toUpperCase();
  const modeLabel = null;

  const logo: Record<string, React.ReactNode> = {
    VISA: (
      <svg viewBox="0 0 38 24" width="32" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#1A1F71"/>
        <text x="19" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="Arial">VISA</text>
      </svg>
    ),
    MASTERCARD: (
      <svg viewBox="0 0 38 24" width="32" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#252525"/>
        <circle cx="15" cy="12" r="7" fill="#EB001B"/>
        <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
        <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00"/>
      </svg>
    ),
    MAESTRO: (
      <svg viewBox="0 0 38 24" width="32" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#1A1F71"/>
        <circle cx="15" cy="12" r="7" fill="#0099DF"/>
        <circle cx="23" cy="12" r="7" fill="#ED0006"/>
        <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#7375CF"/>
      </svg>
    ),
    AMEX: (
      <svg viewBox="0 0 38 24" width="32" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#2E77BC"/>
        <text x="19" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="Arial">AMEX</text>
      </svg>
    ),
    GIROCARD: (
      <svg viewBox="0 0 38 24" width="32" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="38" height="24" rx="4" fill="#004494"/>
        <text x="19" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="Arial">girocard</text>
      </svg>
    ),
  };

  const icon = logo[type] ?? (
    <svg viewBox="0 0 38 24" width="32" height="20" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="4" fill="#4B5563"/>
      <text x="19" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="Arial">{cardType.slice(0,8)}</text>
    </svg>
  );

  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {modeLabel && <span className="text-xs opacity-60">{modeLabel}</span>}
    </span>
  );
}

function formatCurrency(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(
    amount
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(d);
  const rest = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${weekday}. ${rest}`;
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(d);
  const date = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(d);
  return `${weekday}. ${date}`;
}

// ── constants ─────────────────────────────────────────────────────────────────

const STANDORT_COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1"];

function getStandortColor(user: string, allOperators: string[]): string {
  const idx = allOperators.indexOf(user);
  return STANDORT_COLORS[idx >= 0 ? idx % STANDORT_COLORS.length : 0];
}

const ACCOUNT_COLORS: Record<number, string> = {
  1: "#3b82f6",
  2: "#22c55e",
  3: "#a855f7",
};

const ACCOUNT_BG: Record<number, string> = {
  1: "bg-blue-500/20 text-blue-400",
  2: "bg-green-500/20 text-green-400",
  3: "bg-purple-500/20 text-purple-400",
};

const ACCOUNT_BG_LIGHT: Record<number, string> = {
  1: "bg-blue-100 text-blue-700",
  2: "bg-green-100 text-green-700",
  3: "bg-purple-100 text-purple-700",
};

const STATUS_DARK: Record<string, string> = {
  SUCCESSFUL: "bg-emerald-500/20 text-emerald-400",
  FAILED: "bg-red-500/20 text-red-400",
  CANCELLED: "bg-yellow-500/20 text-yellow-400",
  PENDING: "bg-sky-500/20 text-sky-400",
};

const STATUS_LIGHT: Record<string, string> = {
  SUCCESSFUL: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-yellow-100 text-yellow-700",
  PENDING: "bg-sky-100 text-sky-700",
};

type PresetRange = "today" | "7d" | "30d" | "90d" | "custom";

interface Filters {
  preset: PresetRange;
  customFrom: string;
  customTo: string;
  statuses: Set<string>;
  operators: Set<string> | null;
}

function getPresetDates(preset: PresetRange): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);
  if (preset === "today") return { from: to, to };
  const days = preset === "7d" ? 6 : preset === "30d" ? 29 : 89;
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to };
}

function getDaysInRange(from: string, to: string): string[] {
  const days: string[] = [];
  const cur = new Date(from + "T12:00:00Z");
  const end = new Date(to + "T12:00:00Z");
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// ── sub-components ────────────────────────────────────────────────────────────

function AccountBadge({ id, dark, name }: { id: 1 | 2 | 3; dark: boolean; name: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        dark ? ACCOUNT_BG[id] : ACCOUNT_BG_LIGHT[id]
      }`}
    >
      <Building2 size={11} />
      {name}
    </span>
  );
}

const STATUS_DE: Record<string, string> = {
  SUCCESSFUL: "Erfolgreich",
  FAILED: "Fehlgeschlagen",
  CANCELLED: "Abgebrochen",
  PENDING: "Ausstehend",
  REFUNDED: "Erstattet",
  CHARGE_BACK: "Rückbuchung",
};

function StatusBadge({ status, dark }: { status: string; dark: boolean }) {
  const map = dark ? STATUS_DARK : STATUS_LIGHT;
  const style = map[status.toUpperCase()] ?? (dark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600");
  const label = STATUS_DE[status.toUpperCase()] ?? status;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  dark: boolean;
}

function KpiCard({ title, value, subtitle, icon, iconBg, dark }: KpiCardProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 shadow-sm transition-colors ${
        dark
          ? "border-gray-700/60 bg-gray-800"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>
          {title}
        </span>
        <div className={`rounded-xl p-2 ${iconBg}`}>{icon}</div>
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
          {value}
        </p>
        <p className={`mt-0.5 text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>{subtitle}</p>
      </div>
    </div>
  );
}

function ToggleChip({
  active,
  color,
  onClick,
  dark,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  dark: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
        active
          ? "border-transparent text-white shadow-sm"
          : dark
          ? "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
      }`}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {children}
    </button>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const ALL_STATUSES = ["SUCCESSFUL", "FAILED", "CANCELLED", "PENDING"];

type AccountNames = Record<1 | 2 | 3, string>;

export default function Dashboard() {
  const [dark, setDark] = useState(true);
  const [allTransactions, setAllTransactions] = useState<SumUpTransaction[]>([]);
  const [accountNames, setAccountNames] = useState<AccountNames>({ 1: "Konto 1", 2: "Konto 2", 3: "Konto 3" });
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    preset: "7d",
    customFrom: "",
    customTo: "",
    statuses: new Set(ALL_STATUSES),
    operators: null,
  });

  // ── derive API date params ─────────────────────────────────────────────────
  const apiDates = useMemo(() => {
    if (filters.preset === "custom") {
      return { from: filters.customFrom, to: filters.customTo };
    }
    return getPresetDates(filters.preset);
  }, [filters.preset, filters.customFrom, filters.customTo]);

  const fetchData = useCallback(async () => {
    if (!apiDates.from || !apiDates.to) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        start_date: apiDates.from,
        end_date: apiDates.to,
        limit: "500",
      });
      const res = await fetch(`/api/sumup?${qs.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setAllTransactions(data.transactions ?? []);
      if (data.accountNames) setAccountNames(data.accountNames);
      if (data.employeeNames) setEmployeeNames(data.employeeNames);
      setLastRefresh(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [apiDates.from, apiDates.to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── derive available employees (from user field) ─────────────────────────────
  const allOperators = useMemo(() => {
    const set = new Set<string>();
    allTransactions.forEach((t) => {
      if (t.user) set.add(t.user);
    });
    return Array.from(set).sort();
  }, [allTransactions]);

  // ── client-side filtering ──────────────────────────────────────────────────
  const transactions = useMemo(
    () =>
      allTransactions.filter(
        (t) =>
          filters.statuses.has((t.status ?? "").toUpperCase()) &&
          (filters.operators === null || filters.operators.has(t.user ?? ""))
      ),
    [allTransactions, filters.statuses, filters.operators]
  );

  const successful = useMemo(
    () => transactions.filter((t) => t.status?.toUpperCase() === "SUCCESSFUL"),
    [transactions]
  );
  const totalRevenue = successful.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const currency = allTransactions[0]?.currency ?? "EUR";

  const revenueByAccount = ([1, 2, 3] as const).map((id) => ({
    id,
    total: successful.filter((t) => t.accountId === id).reduce((s, t) => s + t.amount, 0),
    count: successful.filter((t) => t.accountId === id).length,
  }));

  const chartDays = useMemo(() => {
    const { from, to } = apiDates;
    if (!from || !to) return [];
    const today = new Date().toISOString().slice(0, 10);
    const effectiveTo = to > today ? today : to;
    const days = getDaysInRange(from, effectiveTo);
    return days.length > 60 ? days.slice(-60) : days;
  }, [apiDates]);

  const chartData = useMemo(
    () =>
      chartDays.map((day) => {
        const row: Record<string, string | number> = {
          date: formatShortDate(day + "T00:00:00"),
        };
        allOperators.forEach((user) => {
          row[user] = successful
            .filter((t) => t.user === user && t.timestamp?.slice(0, 10) === day)
            .reduce((s, t) => s + t.amount, 0);
        });
        return row;
      }),
    [chartDays, successful, allOperators]
  );

  function toggleStatus(s: string) {
    setFilters((f) => {
      const next = new Set(f.statuses);
      next.has(s) ? next.delete(s) : next.add(s);
      return { ...f, statuses: next };
    });
  }

  function toggleOperator(op: string) {
    setFilters((f) => {
      const current = f.operators ?? new Set(allOperators);
      const next = new Set(current);
      next.has(op) ? next.delete(op) : next.add(op);
      const allSelected = allOperators.length > 0 && next.size === allOperators.length;
      return { ...f, operators: allSelected ? null : next };
    });
  }

  const employeeLabel = (email: string) =>
    employeeNames[email] ?? employeeNames[email.toLowerCase()] ?? email;

  function resetFilters() {
    setFilters({
      preset: "7d",
      customFrom: "",
      customTo: "",
      statuses: new Set(ALL_STATUSES),
      operators: null,
    });
  }

  const activeFilterCount =
    (filters.statuses.size < ALL_STATUSES.length ? 1 : 0) +
    (filters.operators !== null ? 1 : 0);

  const presetLabel: Record<PresetRange, string> = {
    today: "Heute",
    "7d": "7 T",
    "30d": "30 T",
    "90d": "90 T",
    custom: "Eigen",
  };

  // chart theme
  const gridColor = dark ? "#374151" : "#f3f4f6";
  const tickColor = dark ? "#6b7280" : "#9ca3af";
  const tooltipStyle = dark
    ? { borderRadius: "12px", border: "1px solid #374151", background: "#1f2937", color: "#f9fafb", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }
    : { borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={dark ? "dark" : ""}>
      <div className={`min-h-screen font-sans transition-colors ${dark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>

        {/* ── Header ── */}
        <header className={`sticky top-0 z-10 border-b backdrop-blur-md ${dark ? "border-gray-700/60 bg-gray-900/80" : "border-gray-200 bg-white/80"}`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 sm:h-9 sm:w-9">
                <CreditCard size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold sm:text-lg">SumUp Dashboard</h1>
                <p className={`hidden text-xs sm:block ${dark ? "text-gray-500" : "text-gray-400"}`}>Live-Daten</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastRefresh && (
                <span className={`hidden text-xs lg:block ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  {lastRefresh.toLocaleTimeString("de-DE")}
                </span>
              )}
              <button
                onClick={() => setDark((d) => !d)}
                className={`rounded-lg border p-2 transition ${dark ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}
                title="Theme wechseln"
              >
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50 sm:text-sm ${dark ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Aktualisieren</span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">

          {/* ── Loading Overlay ── */}
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.35)" }}>
              <div className="flex flex-col items-center gap-3">
                <div style={{ perspective: "220px" }}>
                  <style>{`
                    @keyframes doener-3d {
                      0%   { transform: rotateY(0deg); }
                      100% { transform: rotateY(360deg); }
                    }
                  `}</style>
                  <div style={{ animation: "doener-3d 1.6s linear infinite", transformStyle: "preserve-3d" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96" width="90" height="135">
                      {/* Schatten-Gradient-Simulation: linke Seite dunkler */}
                      <defs>
                        <radialGradient id="meat1" cx="35%" cy="50%" r="60%">
                          <stop offset="0%" stopColor="#f15a4a"/>
                          <stop offset="100%" stopColor="#7b241c"/>
                        </radialGradient>
                        <radialGradient id="meat2" cx="35%" cy="50%" r="60%">
                          <stop offset="0%" stopColor="#e74c3c"/>
                          <stop offset="100%" stopColor="#922b21"/>
                        </radialGradient>
                        <radialGradient id="spit" cx="40%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#f0d080"/>
                          <stop offset="100%" stopColor="#8a6a20"/>
                        </radialGradient>
                      </defs>
                      {/* Spieß mit Glanz */}
                      <rect x="30" y="2" width="4" height="92" rx="2" fill="url(#spit)"/>
                      <polygon points="32,0 28,10 36,10" fill="url(#spit)"/>
                      {/* Fleischlagen mit radialen Gradienten für 3D-Rundung */}
                      <ellipse cx="32" cy="17" rx="11" ry="6.5" fill="url(#meat1)"/>
                      <ellipse cx="32" cy="26" rx="14" ry="7" fill="url(#meat2)"/>
                      <ellipse cx="32" cy="35" rx="16.5" ry="7.5" fill="url(#meat1)"/>
                      <ellipse cx="32" cy="44" rx="17.5" ry="7.5" fill="url(#meat2)"/>
                      <ellipse cx="32" cy="53" rx="16.5" ry="7" fill="url(#meat1)"/>
                      <ellipse cx="32" cy="62" rx="14" ry="6.5" fill="url(#meat2)"/>
                      <ellipse cx="32" cy="71" rx="11" ry="6" fill="url(#meat1)"/>
                      {/* Glanzlinie oben auf jeder Lage */}
                      {[17,26,35,44,53,62,71].map((cy, i) => {
                        const rx = [11,14,16.5,17.5,16.5,14,11][i];
                        return <ellipse key={cy} cx="28" cy={cy - 2} rx={rx * 0.5} ry="1.5" fill="rgba(255,255,255,0.18)"/>;
                      })}
                      {/* Ränder */}
                      {([17,26,35,44,53,62,71] as number[]).map((cy, i) => {
                        const rx = [11,14,16.5,17.5,16.5,14,11][i];
                        return <ellipse key={`b${cy}`} cx="32" cy={cy} rx={rx} ry={[6.5,7,7.5,7.5,7,6.5,6][i]} fill="none" stroke="#5a1a14" strokeWidth="0.6"/>;
                      })}
                    </svg>
                  </div>
                </div>
                <span className="text-xl font-semibold text-white/90">Wird geladen…</span>
              </div>
            </div>
          )}

          {/* ── Error Banner ── */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Fehler beim Laden</p>
                <p className="mt-0.5 text-xs opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* ── Filter Bar ── */}
          <section className={`rounded-2xl border shadow-sm ${dark ? "border-gray-700/60 bg-gray-800" : "border-gray-100 bg-white"}`}>
            {/* Filter header – always visible, collapsible on mobile */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 sm:cursor-default sm:px-5 sm:py-4"
            >
              <div className="flex items-center gap-2">
                <Filter size={14} className={dark ? "text-gray-400" : "text-gray-500"} />
                <span className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-gray-400" : "text-gray-500"}`}>
                  Filter
                </span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
                <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  · {apiDates.from ? `${formatShortDate(apiDates.from + "T00:00:00")} – ${formatShortDate(apiDates.to + "T00:00:00")}` : "—"}
                </span>
              </div>
              <span className={`sm:hidden ${dark ? "text-gray-500" : "text-gray-400"}`}>
                {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            <div className={`overflow-hidden transition-all sm:block ${filtersOpen ? "block" : "hidden"}`}>
              <div className={`border-t px-4 pb-4 pt-3 sm:px-5 sm:pb-5 ${dark ? "border-gray-700/60" : "border-gray-100"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-6">

                  {/* Zeitraum */}
                  <div className="flex flex-col gap-2">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>
                      <Calendar size={11} /> Zeitraum
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(["today", "7d", "30d", "90d", "custom"] as PresetRange[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setFilters((f) => ({ ...f, preset: p }))}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                            filters.preset === p
                              ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                              : dark
                              ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {presetLabel[p]}
                        </button>
                      ))}
                    </div>
                    {filters.preset === "custom" && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <input
                          type="date"
                          value={filters.customFrom}
                          onChange={(e) => setFilters((f) => ({ ...f, customFrom: e.target.value }))}
                          className={`rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? "border-gray-600 bg-gray-700 text-gray-200" : "border-gray-200 bg-white text-gray-700"}`}
                        />
                        <span className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>bis</span>
                        <input
                          type="date"
                          value={filters.customTo}
                          onChange={(e) => setFilters((f) => ({ ...f, customTo: e.target.value }))}
                          className={`rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? "border-gray-600 bg-gray-700 text-gray-200" : "border-gray-200 bg-white text-gray-700"}`}
                        />
                        <button
                          onClick={fetchData}
                          disabled={!filters.customFrom || !filters.customTo || loading}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                        >
                          Laden
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className={`hidden w-px self-stretch sm:block ${dark ? "bg-gray-700" : "bg-gray-100"}`} />

                  {/* Standort */}
                  {allOperators.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>
                        <Users size={11} /> Standort
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {allOperators.map((op) => {
                          const active = filters.operators === null || filters.operators.has(op);
                          return (
                            <ToggleChip
                              key={op}
                              active={active}
                              color={getStandortColor(op, allOperators)}
                              onClick={() => toggleOperator(op)}
                              dark={dark}
                            >
                              {employeeLabel(op)}
                            </ToggleChip>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  {allOperators.length > 0 && (
                    <div className={`hidden w-px self-stretch sm:block ${dark ? "bg-gray-700" : "bg-gray-100"}`} />
                  )}

                  {/* Status */}
                  <div className="flex flex-col gap-2">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>
                      <Filter size={11} /> Status
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_STATUSES.map((s) => (
                        <ToggleChip
                          key={s}
                          active={filters.statuses.has(s)}
                          color={s === "SUCCESSFUL" ? "#10b981" : s === "FAILED" ? "#ef4444" : s === "CANCELLED" ? "#f59e0b" : "#0ea5e9"}
                          onClick={() => toggleStatus(s)}
                          dark={dark}
                        >
                          {s === "SUCCESSFUL" ? "Erfolgreich" : s === "FAILED" ? "Fehler" : s === "CANCELLED" ? "Abbruch" : "Offen"}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>

                  {/* Reset */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className={`flex items-center gap-1 self-start rounded-lg border px-2.5 py-1.5 text-xs transition sm:ml-auto ${dark ? "border-gray-600 text-gray-400 hover:bg-gray-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                    >
                      <X size={11} /> Zurücksetzen
                    </button>
                  )}
                </div>

                <p className={`mt-3 text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>
                  {transactions.length} Transaktionen · {successful.length} erfolgreich
                </p>
              </div>
            </div>
          </section>

          {/* ── KPI Cards ── */}
          <section>
            <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>
              Übersicht
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
              <KpiCard
                title="Gesamtumsatz"
                value={loading ? "–" : formatCurrency(totalRevenue, currency)}
                subtitle="Alle Konten"
                icon={<TrendingUp size={16} className="text-blue-500" />}
                iconBg={dark ? "bg-blue-500/20" : "bg-blue-50"}
                dark={dark}
              />
              <KpiCard
                title="Erfolgreiche Tx"
                value={loading ? "–" : successful.length.toString()}
                subtitle={`von ${transactions.length}`}
                icon={<CheckCircle2 size={16} className="text-emerald-500" />}
                iconBg={dark ? "bg-emerald-500/20" : "bg-emerald-50"}
                dark={dark}
              />
              {revenueByAccount.map(({ id, total, count }) => (
                <KpiCard
                  key={id}
                  title={accountNames[id]}
                  value={loading ? "–" : formatCurrency(total, currency)}
                  subtitle={`${count} Tx`}
                  icon={<Building2 size={16} style={{ color: ACCOUNT_COLORS[id] }} />}
                  iconBg={
                    id === 1
                      ? dark ? "bg-blue-500/20" : "bg-blue-50"
                      : id === 2
                      ? dark ? "bg-green-500/20" : "bg-green-50"
                      : dark ? "bg-purple-500/20" : "bg-purple-50"
                  }
                  dark={dark}
                />
              ))}
            </div>
          </section>

          {/* ── Chart ── */}
          <section>
            <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>
              Umsatz im Zeitraum
            </p>
            <div className={`rounded-2xl border p-4 shadow-sm sm:p-6 ${dark ? "border-gray-700/60 bg-gray-800" : "border-gray-100 bg-white"}`}>
              {loading ? (
                <div className={`flex h-56 items-center justify-center ${dark ? "text-gray-600" : "text-gray-400"}`}>
                  <RefreshCw size={22} className="animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: tickColor }}
                      axisLine={false}
                      tickLine={false}
                      interval={chartDays.length > 14 ? Math.floor(chartDays.length / 8) : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: tickColor }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                    />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        formatCurrency(Number(value), currency),
                        employeeLabel(String(name)),
                      ]}
                      contentStyle={tooltipStyle}
                    />
                    <Legend
                      formatter={(value: string) => (
                        <span
                          onClick={() => setFilters((f) => ({ ...f, operators: new Set([value]) }))}
                          style={{ cursor: "pointer" }}
                          title={`Nach ${employeeLabel(value)} filtern`}
                        >
                          {employeeLabel(value)}
                        </span>
                      )}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    {allOperators.map((user, i) => (
                      <Bar
                        key={user}
                        dataKey={user}
                        stackId="a"
                        fill={STANDORT_COLORS[i % STANDORT_COLORS.length]}
                        radius={i === allOperators.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        isAnimationActive={false}
                        style={{ cursor: "pointer" }}
                        onClick={() => setFilters((f) => ({ ...f, operators: new Set([user]) }))}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* ── Transaction Table ── */}
          <section className="pb-10">
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>
                Transaktionen
              </p>
              <span className={`text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>
                {transactions.length} Einträge
              </span>
            </div>
            <div className={`overflow-hidden rounded-2xl border shadow-sm ${dark ? "border-gray-700/60 bg-gray-800" : "border-gray-100 bg-white"}`}>
              {loading ? (
                <div className={`flex h-48 items-center justify-center ${dark ? "text-gray-600" : "text-gray-400"}`}>
                  <RefreshCw size={22} className="animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className={`flex h-48 items-center justify-center text-sm ${dark ? "text-gray-600" : "text-gray-400"}`}>
                  Keine Transaktionen für die gewählten Filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b text-left ${dark ? "border-gray-700/60 bg-gray-700/40" : "border-gray-100 bg-gray-50"}`}>
                        <th className={`px-4 py-3 text-xs font-semibold ${dark ? "text-gray-400" : "text-gray-500"}`}>Datum</th>
                        <th className={`px-4 py-3 text-xs font-semibold ${dark ? "text-gray-400" : "text-gray-500"}`}>Betrag</th>
                        <th className={`px-4 py-3 text-xs font-semibold ${dark ? "text-gray-400" : "text-gray-500"}`}>Status</th>
                        <th className={`px-4 py-3 text-xs font-semibold ${dark ? "text-gray-400" : "text-gray-500"}`}>Standort</th>
                        <th className={`hidden px-4 py-3 text-xs font-semibold sm:table-cell ${dark ? "text-gray-400" : "text-gray-500"}`}>Karte</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dark ? "divide-gray-700/40" : "divide-gray-50"}`}>
                      {transactions.slice(0, 100).map((tx) => (
                        <tr
                          key={`${tx.accountId}-${tx.id ?? tx.transaction_code}`}
                          className={`transition-colors ${dark ? "hover:bg-gray-700/30" : "hover:bg-gray-50/70"}`}
                        >
                          <td className={`px-4 py-3 text-xs sm:text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
                            {tx.timestamp ? formatDate(tx.timestamp) : "—"}
                          </td>
                          <td className={`px-4 py-3 text-xs font-semibold sm:text-sm ${dark ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(tx.amount ?? 0, tx.currency ?? currency)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={tx.status ?? "—"} dark={dark} />
                          </td>
                          <td className="px-4 py-3">
                            {tx.user ? (
                              <button
                                onClick={() => {
                                  setFilters((f) => ({ ...f, operators: new Set([tx.user!]) }));
                                }}
                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-75 cursor-pointer"
                                style={{
                                  backgroundColor: getStandortColor(tx.user, allOperators) + "33",
                                  color: getStandortColor(tx.user, allOperators),
                                }}
                                title={`Nach ${employeeLabel(tx.user)} filtern`}
                              >
                                {employeeLabel(tx.user)}
                              </button>
                            ) : (
                              <span className={`text-xs ${dark ? "text-gray-400" : "text-gray-600"}`}>
                                {accountNames[tx.accountId]}
                              </span>
                            )}
                          </td>
                          <td className={`hidden px-4 py-3 text-xs sm:table-cell ${dark ? "text-gray-400" : "text-gray-600"}`}>
                            {tx.card_type ? <CardTypeBadge cardType={tx.card_type} entryMode={tx.entry_mode} /> : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length > 100 && (
                    <p className={`border-t px-5 py-3 text-center text-xs ${dark ? "border-gray-700/60 text-gray-600" : "border-gray-100 text-gray-400"}`}>
                      Zeige 100 von {transactions.length} Transaktionen
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
