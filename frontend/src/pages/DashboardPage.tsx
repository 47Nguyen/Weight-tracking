import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "../api/client";

type WeightEntry = { id: number; entry_date: string; weight_kg: number };
type Profile = {
  target_weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  exercise_level: string | null;
};

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [date, setDate] = useState(todayISODate);
  const [weight, setWeight] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [w, p] = await Promise.all([
      apiFetch<WeightEntry[]>("/api/weights"),
      apiFetch<Profile>("/api/profile"),
    ]);
    setEntries(w);
    setProfile(p);
  }, []);

  useEffect(() => {
    void load().catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, [load]);

  const chartData = useMemo(
    () =>
      entries.map((e) => ({
        date: e.entry_date,
        weight: e.weight_kg,
      })),
    [entries]
  );

  const latest = entries.length ? entries[entries.length - 1] : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const wn = Number(weight);
    if (!Number.isFinite(wn) || wn <= 0) {
      setErr("Enter a valid weight");
      return;
    }
    try {
      await apiFetch("/api/weights", {
        method: "POST",
        json: { entry_date: date, weight_kg: wn },
      });
      setMsg("Saved");
      setWeight("");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    }
  }

  async function removeEntry(d: string) {
    setErr(null);
    try {
      await apiFetch(`/api/weights/${d}`, { method: "DELETE" });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Delete failed");
    }
  }

  const target = profile?.target_weight_kg;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Dashboard</h1>
        <p className="muted">Log daily weight and watch the trend against your target.</p>
      </header>

      <div className="grid two">
        <section className="card">
          <h2>Log weight</h2>
          <form className="form row-form" onSubmit={onSubmit}>
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label>
              Weight (kg)
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 72.4"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn primary">
              Save entry
            </button>
          </form>
          {msg && <p className="success">{msg}</p>}
          {err && <p className="error">{err}</p>}
        </section>

        <section className="card stats">
          <h2>Snapshot</h2>
          <dl className="stat-list">
            <div>
              <dt>Latest weight</dt>
              <dd>{latest ? `${latest.weight_kg} kg` : "—"}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>{target != null ? `${target} kg` : "Set in Profile"}</dd>
            </div>
            <div>
              <dt>Entries</dt>
              <dd>{entries.length}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="card chart-card">
        <h2>Trend</h2>
        {chartData.length === 0 ? (
          <p className="muted">Add a weight entry to see your chart.</p>
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted)" }} />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "var(--muted)" }}
                  label={{ value: "kg", angle: -90, position: "insideLeft", fill: "var(--muted)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2} dot={false} />
                {target != null && (
                  <ReferenceLine
                    y={target}
                    stroke="var(--muted)"
                    strokeDasharray="4 4"
                    label={{ value: "Target", fill: "var(--muted)", position: "insideTopRight" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card">
        <h2>History</h2>
        {entries.length === 0 ? (
          <p className="muted">No entries yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...entries]
                .sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1))
                .map((e) => (
                  <tr key={e.id}>
                    <td>{e.entry_date}</td>
                    <td>{e.weight_kg}</td>
                    <td className="actions">
                      <button type="button" className="btn ghost small" onClick={() => removeEntry(e.entry_date)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
