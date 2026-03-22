import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../api/client";

type Profile = {
  target_weight_kg: number | null;
  height_cm: number | null;
};

type ScenarioRow = {
  id: string;
  label: string;
  gender: "male" | "female" | "other";
  age: string;
  exercise_level: "sedentary" | "light" | "moderate" | "active" | "very_active";
};

type ScenarioResult = {
  label: string | null;
  gender: string;
  age: number;
  exercise_level: string;
  bmr_kcal: number;
  tdee_kcal: number;
  suggested_intake_kcal: number;
  daily_deficit_kcal: number;
  estimated_days_to_target: number | null;
  sustainability_score: number;
  rank: number;
};

type CompareResponse = {
  current_weight_kg: number;
  target_weight_kg: number;
  weight_to_lose_kg: number;
  best_rank: number;
  scenarios: ScenarioResult[];
  disclaimer: string;
};

function newRow(i: number): ScenarioRow {
  return {
    id: crypto.randomUUID(),
    label: `Option ${i}`,
    gender: "male",
    age: "30",
    exercise_level: "moderate",
  };
}

export function AnalysisPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [target, setTarget] = useState("");
  const [height, setHeight] = useState("");
  const [currentOverride, setCurrentOverride] = useState("");
  const [rows, setRows] = useState<ScenarioRow[]>(() => [newRow(1), newRow(2), newRow(3)]);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Profile>("/api/profile")
      .then((p) => {
        setProfile(p);
        if (p.target_weight_kg != null) setTarget(String(p.target_weight_kg));
        if (p.height_cm != null) setHeight(String(p.height_cm));
      })
      .catch(() => {});
  }, []);

  function addRow() {
    setRows((r) => [...r, newRow(r.length + 1)]);
  }

  function removeRow(id: string) {
    setRows((r) => (r.length <= 1 ? r : r.filter((x) => x.id !== id)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setResult(null);
    const h = Number(height);
    const tgt = Number(target);
    if (!Number.isFinite(h) || !Number.isFinite(tgt)) {
      setErr("Height and target weight are required numbers.");
      return;
    }
    const co = currentOverride.trim() === "" ? null : Number(currentOverride);
    if (currentOverride.trim() !== "" && !Number.isFinite(co)) {
      setErr("Current weight override must be a number.");
      return;
    }
    const scenarios = rows.map((r) => ({
      label: r.label.trim() || null,
      gender: r.gender,
      age: Number(r.age),
      exercise_level: r.exercise_level,
    }));
    for (const s of scenarios) {
      if (!Number.isFinite(s.age) || s.age < 10) {
        setErr("Each scenario needs a valid age.");
        return;
      }
    }
    try {
      const res = await apiFetch<CompareResponse>("/api/analysis/compare-scenarios", {
        method: "POST",
        json: {
          height_cm: h,
          target_weight_kg: tgt,
          current_weight_kg: co,
          scenarios,
        },
      });
      setResult(res);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Analysis failed");
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Scenario analysis</h1>
        <p className="muted">
          Compare combinations of gender, age, and exercise level. The app ranks routes by balancing estimated time to
          target and a sustainability score (gentler deficits score higher).
        </p>
      </header>

      <section className="card">
        <h2>Inputs</h2>
        <form className="form" onSubmit={onSubmit}>
          <div className="grid two tight">
            <label>
              Height (cm)
              <input
                type="number"
                min="50"
                max="260"
                required
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={profile?.height_cm != null ? String(profile.height_cm) : "172"}
              />
            </label>
            <label>
              Target weight (kg)
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={profile?.target_weight_kg != null ? String(profile.target_weight_kg) : "68"}
              />
            </label>
          </div>
          <label>
            Current weight (kg) — optional
            <input
              type="number"
              step="0.1"
              min="0"
              value={currentOverride}
              onChange={(e) => setCurrentOverride(e.target.value)}
              placeholder="Uses your latest log if empty"
            />
          </label>

          <h3 className="h3">Scenarios to compare</h3>
          <div className="scenario-list">
            {rows.map((r, idx) => (
              <div key={r.id} className="scenario-row card inner">
                <div className="scenario-row-head">
                  <span className="muted small">#{idx + 1}</span>
                  {rows.length > 1 && (
                    <button type="button" className="btn ghost small" onClick={() => removeRow(r.id)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid three tight">
                  <label>
                    Label
                    <input value={r.label} onChange={(e) => setRows((x) => x.map((y) => (y.id === r.id ? { ...y, label: e.target.value } : y)))} />
                  </label>
                  <label>
                    Gender
                    <select
                      value={r.gender}
                      onChange={(e) =>
                        setRows((x) =>
                          x.map((y) => (y.id === r.id ? { ...y, gender: e.target.value as ScenarioRow["gender"] } : y))
                        )
                      }
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label>
                    Age
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={r.age}
                      onChange={(e) => setRows((x) => x.map((y) => (y.id === r.id ? { ...y, age: e.target.value } : y)))}
                    />
                  </label>
                  <label className="span-3">
                    Exercise
                    <select
                      value={r.exercise_level}
                      onChange={(e) =>
                        setRows((x) =>
                          x.map((y) =>
                            y.id === r.id ? { ...y, exercise_level: e.target.value as ScenarioRow["exercise_level"] } : y
                          )
                        )
                      }
                    >
                      <option value="sedentary">Sedentary</option>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="active">Active</option>
                      <option value="very_active">Very active</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="row-actions">
            <button type="button" className="btn ghost" onClick={addRow}>
              Add scenario
            </button>
            <button type="submit" className="btn primary">
              Run comparison
            </button>
          </div>
          {err && <p className="error">{err}</p>}
        </form>
      </section>

      {result && (
        <section className="card">
          <h2>Results</h2>
          <p className="muted small">
            Current <strong>{result.current_weight_kg} kg</strong> → target <strong>{result.target_weight_kg} kg</strong>{" "}
            (lose <strong>{result.weight_to_lose_kg} kg</strong>). Best rank: <strong>#{result.best_rank}</strong>.
          </p>
          <div className="table-scroll">
            <table className="table dense">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Label</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Exercise</th>
                  <th>BMR</th>
                  <th>TDEE</th>
                  <th>Suggested intake</th>
                  <th>Deficit / day</th>
                  <th>Est. days</th>
                  <th>Sustainability</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((s) => (
                  <tr key={`${s.rank}-${s.label}`} className={s.rank === result.best_rank ? "row-best" : undefined}>
                    <td>{s.rank}</td>
                    <td>{s.label}</td>
                    <td>{s.gender}</td>
                    <td>{s.age}</td>
                    <td>{s.exercise_level.replace("_", " ")}</td>
                    <td>{s.bmr_kcal}</td>
                    <td>{s.tdee_kcal}</td>
                    <td>{s.suggested_intake_kcal}</td>
                    <td>{s.daily_deficit_kcal}</td>
                    <td>{s.estimated_days_to_target != null ? s.estimated_days_to_target : "—"}</td>
                    <td>{s.sustainability_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small disclaimer">{result.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
