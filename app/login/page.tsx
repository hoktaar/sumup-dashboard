"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pinLength, setPinLength] = useState<number | null>(null);
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then(({ length }) => {
        setPinLength(length);
        setPin(Array(length).fill(""));
        setTimeout(() => inputs.current[0]?.focus(), 50);
      });
  }, []);

  async function handleSubmit(fullPin: string) {
    setLoading(true);
    setError(false);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: fullPin }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
      setPin(Array(pinLength ?? 4).fill(""));
      setTimeout(() => inputs.current[0]?.focus(), 50);
    }
  }

  function handleChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...pin];
    next[i] = val.slice(-1);
    setPin(next);
    setError(false);
    if (val && i < (pinLength ?? 4) - 1) {
      inputs.current[i + 1]?.focus();
    }
    // Auto-submit when all fields filled
    if (next.every((v) => v !== "")) {
      handleSubmit(next.join(""));
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "Enter") {
      const full = pin.join("");
      if (full.length === pinLength) handleSubmit(full);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      {/* Döner Logo */}
      <div className="mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96" width="64" height="96">
          <defs>
            <radialGradient id="lmeat1" cx="35%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#f15a4a"/>
              <stop offset="100%" stopColor="#7b241c"/>
            </radialGradient>
            <radialGradient id="lmeat2" cx="35%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#e74c3c"/>
              <stop offset="100%" stopColor="#922b21"/>
            </radialGradient>
            <radialGradient id="lspit" cx="40%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#f0d080"/>
              <stop offset="100%" stopColor="#8a6a20"/>
            </radialGradient>
          </defs>
          <rect x="30" y="2" width="4" height="92" rx="2" fill="url(#lspit)"/>
          <polygon points="32,0 28,10 36,10" fill="url(#lspit)"/>
          <ellipse cx="32" cy="17" rx="11" ry="6.5" fill="url(#lmeat1)"/>
          <ellipse cx="32" cy="26" rx="14" ry="7" fill="url(#lmeat2)"/>
          <ellipse cx="32" cy="35" rx="16.5" ry="7.5" fill="url(#lmeat1)"/>
          <ellipse cx="32" cy="44" rx="17.5" ry="7.5" fill="url(#lmeat2)"/>
          <ellipse cx="32" cy="53" rx="16.5" ry="7" fill="url(#lmeat1)"/>
          <ellipse cx="32" cy="62" rx="14" ry="6.5" fill="url(#lmeat2)"/>
          <ellipse cx="32" cy="71" rx="11" ry="6" fill="url(#lmeat1)"/>
        </svg>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-white">SumUp Dashboard</h1>
      <p className="mb-8 text-sm text-gray-500">PIN eingeben um fortzufahren</p>

      <div className="w-full max-w-xs rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <div className="mb-6 flex justify-center gap-3">
          {pinLength === null ? (
            // Skeleton while loading
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 w-10 animate-pulse rounded-xl bg-gray-800" />
            ))
          ) : pin.map((v, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={v}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-12 w-10 rounded-xl border-2 bg-gray-800 text-center text-xl font-bold text-white outline-none transition-all
                ${error ? "border-red-500 animate-pulse" : v ? "border-blue-500" : "border-gray-700"}
                focus:border-blue-400`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 text-center text-sm font-medium text-red-400">
            Falscher PIN. Bitte erneut versuchen.
          </p>
        )}

        <button
          onClick={() => handleSubmit(pin.join(""))}
          disabled={loading || pinLength === null || pin.filter((v) => v).length < (pinLength ?? 4)}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {loading ? "Prüfe…" : "Entsperren"}
        </button>
      </div>

      <p className="mt-6 text-xs text-gray-700">Yaman Döner Dashboard · Zugang gesichert</p>
    </div>
  );
}
