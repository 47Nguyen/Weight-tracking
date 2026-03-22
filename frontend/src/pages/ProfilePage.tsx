import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Profile = {
  target_weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  exercise_level: string | null;
};

const genders = [
  { value: "", label: "Not set" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const exercises = [
  { value: "", label: "Not set" },
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very active" },
];

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [target, setTarget] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [exercise, setExercise] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<Profile>("/api/profile")
      .then((p) => {
        setProfile(p);
        setTarget(p.target_weight_kg != null ? String(p.target_weight_kg) : "");
        setHeight(p.height_cm != null ? String(p.height_cm) : "");
        setAge(p.age != null ? String(p.age) : "");
        setGender(p.gender ?? "");
        setExercise(p.exercise_level ?? "");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    const body: Record<string, unknown> = {};
    if (target.trim() !== "") body.target_weight_kg = Number(target);
    else body.target_weight_kg = null;
    if (height.trim() !== "") body.height_cm = Number(height);
    else body.height_cm = null;
    if (age.trim() !== "") body.age = Number(age);
    else body.age = null;
    body.gender = gender === "" ? null : gender;
    body.exercise_level = exercise === "" ? null : exercise;
    try {
      const p = await apiFetch<Profile>("/api/profile", { method: "PATCH", json: body });
      setProfile(p);
      setOk("Profile saved");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>Profile</h1>
        <p className="muted">Target weight and body stats feed the scenario comparison tool.</p>
      </header>

      <section className="card narrow">
        <h2>Your settings</h2>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Target weight (kg)
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 68"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>
          <label>
            Height (cm)
            <input
              type="number"
              step="0.1"
              min="50"
              max="260"
              placeholder="e.g. 172"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </label>
          <label>
            Age
            <input type="number" min="10" max="120" placeholder="e.g. 32" value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <label>
            Gender
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              {genders.map((g) => (
                <option key={g.value || "empty"} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Typical exercise level
            <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
              {exercises.map((x) => (
                <option key={x.value || "empty"} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          {err && <p className="error">{err}</p>}
          {ok && <p className="success">{ok}</p>}
          <button type="submit" className="btn primary">
            Save profile
          </button>
        </form>
        {profile && user && (
          <p className="muted small" style={{ marginTop: "1rem" }}>
            Stored for <strong>{user.username}</strong>.
          </p>
        )}
      </section>
    </div>
  );
}
