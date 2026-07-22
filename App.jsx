import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "./supabaseClient";

const TOKENS = {
  navyDeep: "#0C1826",
  navy: "#132840",
  paper: "#EEF1F0",
  paperCard: "#F8F9F6",
  ink: "#182233",
  muted: "#66707D",
  line: "#D7DCD4",
  amber: "#C9821F",
  teal: "#1F6F5C",
  slate: "#5B6472",
  red: "#B14A3B",
};

const OUTCOMES = ["Connected", "Not Picked", "Switched Off", "Wrong Number", "Call Back Later"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function stampRotation(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100;
  return (h % 7) - 3;
}
function outcomeColor(o) {
  if (o === "Connected") return TOKENS.teal;
  if (o === "Call Back Later") return TOKENS.amber;
  return TOKENS.slate;
}

function Stamp({ text, color, id }) {
  const rot = stampRotation(id + text);
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10.5px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color,
        border: `1.5px solid ${color}`,
        borderRadius: "3px",
        padding: "2px 7px",
        transform: `rotate(${rot}deg)`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function Field({ label, required, children }) {
  return (
    <label style={{ display: "block", marginBottom: "16px" }}>
      <span style={{ display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: TOKENS.muted, marginBottom: "6px" }}>
        {label}
        {required && <span style={{ color: TOKENS.red }}> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  fontFamily: "'Inter', sans-serif",
  fontSize: "14.5px",
  color: TOKENS.ink,
  background: "#fff",
  border: `1.5px solid ${TOKENS.line}`,
  borderRadius: "6px",
  outline: "none",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function Select({ children, ...props }) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      {children}
    </select>
  );
}
function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, minHeight: "72px", resize: "vertical", ...(props.style || {}) }} />;
}

function YesNoToggle({ value, onChange }) {
  const opt = (v, label) => (
    <button
      type="button"
      onClick={() => onChange(v)}
      style={{
        flex: 1,
        padding: "9px 0",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11.5px",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontWeight: 600,
        cursor: "pointer",
        border: `1.5px solid ${value === v ? TOKENS.navy : TOKENS.line}`,
        background: value === v ? TOKENS.navy : "#fff",
        color: value === v ? "#fff" : TOKENS.muted,
        borderRadius: "6px",
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {opt(true, "Yes")}
      {opt(false, "No")}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "6px",
        border: "none",
        background: TOKENS.navy,
        color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: "14.5px",
        cursor: "pointer",
        ...(props.style || {}),
      }}
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="11.5" stroke={TOKENS.amber} strokeWidth="1.5" />
        <path d="M8 13a5 5 0 0 1 5-5" stroke={TOKENS.amber} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 13a5 5 0 0 1-5 5" stroke={TOKENS.amber} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="13" r="1.8" fill={TOKENS.amber} />
      </svg>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "16px", color: "#fff" }}>
        Revolys <span style={{ color: TOKENS.amber, fontWeight: 500 }}>Field Log</span>
      </div>
    </div>
  );
}

function ChipButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "7px 12px",
        borderRadius: "5px",
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.25)",
        background: "transparent",
        color: "rgba(255,255,255,0.7)",
      }}
    >
      {children}
    </button>
  );
}

function HeaderBar({ right }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${TOKENS.navyDeep}, ${TOKENS.navy})`, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
      <Logo />
      {right}
    </div>
  );
}

function Landing({ goTo }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: "22px" }}>
      <div style={{ textAlign: "center", maxWidth: "440px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "22px", color: TOKENS.ink, marginBottom: "8px" }}>Who's logging in?</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: TOKENS.muted, lineHeight: 1.5 }}>
          One site, two logins — the intern records each school call, and it shows up live on the admin dashboard.
        </div>
      </div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={() => goTo("internLogin")} style={{ width: "220px", padding: "26px 20px", borderRadius: "10px", border: `1.5px solid ${TOKENS.line}`, background: TOKENS.paperCard, cursor: "pointer", textAlign: "left" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", letterSpacing: "0.08em", color: TOKENS.amber, marginBottom: "8px" }}>INTERN</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "17px", color: TOKENS.ink }}>Log In to Log Calls</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: TOKENS.muted, marginTop: "6px" }}>Select your name and enter your PIN.</div>
        </button>
        <button onClick={() => goTo("adminLogin")} style={{ width: "220px", padding: "26px 20px", borderRadius: "10px", border: `1.5px solid ${TOKENS.line}`, background: TOKENS.paperCard, cursor: "pointer", textAlign: "left" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", letterSpacing: "0.08em", color: TOKENS.teal, marginBottom: "8px" }}>ADMIN</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "17px", color: TOKENS.ink }}>Admin Login</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: TOKENS.muted, marginTop: "6px" }}>Enter your username and password.</div>
        </button>
      </div>
    </div>
  );
}

function InternLogin({ interns, onSuccess, goTo }) {
  const [name, setName] = useState(interns[0]?.name || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const match = interns.find((i) => i.name === name);
    if (!match) {
      setError("Select your name from the list.");
      return;
    }
    if (pin !== match.pin) {
      setError("Wrong PIN. Ask the admin if you've forgotten it.");
      return;
    }
    setError("");
    onSuccess(match.name);
  }

  return (
    <div style={{ maxWidth: "380px", margin: "0 auto", padding: "50px 20px" }}>
      <form onSubmit={submit} style={{ background: TOKENS.paperCard, border: `1.5px solid ${TOKENS.line}`, borderRadius: "10px", padding: "24px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "18px", color: TOKENS.ink, marginBottom: "18px" }}>Intern Login</div>
        {interns.length === 0 ? (
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13.5px", color: TOKENS.muted, marginBottom: "14px" }}>
            No interns set up yet. Ask the admin to add you from the dashboard first.
          </div>
        ) : (
          <>
            <Field label="Your name" required>
              <Select value={name} onChange={(e) => setName(e.target.value)}>
                {interns.map((i) => (
                  <option key={i.id} value={i.name}>{i.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="PIN" required>
              <TextInput type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit PIN" />
            </Field>
            {error && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: TOKENS.red, marginBottom: "12px" }}>{error}</div>}
            <PrimaryButton type="submit">Log In</PrimaryButton>
          </>
        )}
        <button type="button" onClick={() => goTo("landing")} style={{ marginTop: "14px", width: "100%", background: "transparent", border: "none", color: TOKENS.muted, fontFamily: "'Inter', sans-serif", fontSize: "12.5px", cursor: "pointer" }}>
          ← Back
        </button>
      </form>
    </div>
  );
}

function AdminLogin({ adminCreds, onSuccess, goTo }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!adminCreds) {
      setError("Admin account not set up yet. Run the schema SQL first.");
      return;
    }
    if (username.trim() !== adminCreds.username || password !== adminCreds.password) {
      setError("Wrong username or password.");
      return;
    }
    setError("");
    onSuccess();
  }

  return (
    <div style={{ maxWidth: "380px", margin: "0 auto", padding: "50px 20px" }}>
      <form onSubmit={submit} style={{ background: TOKENS.paperCard, border: `1.5px solid ${TOKENS.line}`, borderRadius: "10px", padding: "24px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "18px", color: TOKENS.ink, marginBottom: "18px" }}>Admin Login</div>
        <Field label="Username" required>
          <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" autoFocus autoCapitalize="none" />
        </Field>
        <Field label="Password" required>
          <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        </Field>
        {error && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: TOKENS.red, marginBottom: "12px" }}>{error}</div>}
        <PrimaryButton type="submit">Log In</PrimaryButton>
        <button type="button" onClick={() => goTo("landing")} style={{ marginTop: "14px", width: "100%", background: "transparent", border: "none", color: TOKENS.muted, fontFamily: "'Inter', sans-serif", fontSize: "12.5px", cursor: "pointer" }}>
          ← Back
        </button>
      </form>
    </div>
  );
}

function InternForm({ calls, addCall, loggedInName }) {
  const blank = { schoolName: "", city: "", outcome: "", interested: null, notes: "", whatsappShared: null, followUpNeeded: null, followUpDate: "" };
  const [form, setForm] = useState(blank);
  const [justLogged, setJustLogged] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.schoolName.trim() || !form.outcome) {
      setError("School name and call outcome are required.");
      return;
    }
    setError("");
    setSaving(true);
    const ok = await addCall({
      logged_by: loggedInName,
      school_name: form.schoolName.trim(),
      city: form.city.trim(),
      outcome: form.outcome,
      interested: form.outcome === "Connected" ? form.interested : null,
      notes: form.notes.trim(),
      whatsapp_shared: !!form.whatsappShared,
      follow_up_needed: !!form.followUpNeeded,
      follow_up_date: form.followUpNeeded && form.followUpDate ? form.followUpDate : null,
      follow_up_done: false,
      call_date: todayStr(),
    });
    setSaving(false);
    if (!ok) {
      setError("Couldn't save — check your connection and try again.");
      return;
    }
    setForm(blank);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2200);
  }

  const todaysCalls = useMemo(
    () => calls.filter((c) => c.call_date === todayStr() && c.logged_by === loggedInName).sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1)),
    [calls, loggedInName]
  );

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "28px 20px 60px" }}>
      <form onSubmit={submit} style={{ background: TOKENS.paperCard, border: `1.5px solid ${TOKENS.line}`, borderRadius: "10px", padding: "24px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "18px", color: TOKENS.ink, marginBottom: "18px" }}>New Call Entry</div>
        <Field label="School name" required>
          <TextInput value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} placeholder="e.g. Sunrise Public School" />
        </Field>
        <Field label="City">
          <TextInput value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Rajkot" />
        </Field>
        <Field label="Call outcome" required>
          <Select value={form.outcome} onChange={(e) => update("outcome", e.target.value)}>
            <option value="">Select outcome</option>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </Select>
        </Field>
        {form.outcome === "Connected" && (
          <Field label="Interested?">
            <YesNoToggle value={form.interested} onChange={(v) => update("interested", v)} />
          </Field>
        )}
        <Field label="Notes of the call">
          <TextArea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="What was discussed / any requirement mentioned" />
        </Field>
        <Field label="WhatsApp company profile shared?">
          <YesNoToggle value={form.whatsappShared} onChange={(v) => update("whatsappShared", v)} />
        </Field>
        <Field label="Needs a follow-up call?">
          <YesNoToggle value={form.followUpNeeded} onChange={(v) => update("followUpNeeded", v)} />
        </Field>
        {form.followUpNeeded && (
          <Field label="Follow-up date">
            <TextInput type="date" value={form.followUpDate} onChange={(e) => update("followUpDate", e.target.value)} />
          </Field>
        )}
        {error && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: TOKENS.red, marginBottom: "12px" }}>{error}</div>}
        <PrimaryButton type="submit" disabled={saving} style={saving ? { opacity: 0.6 } : {}}>
          {saving ? "Saving…" : justLogged ? "Logged ✓" : "Log Call"}
        </PrimaryButton>
      </form>

      <div style={{ marginTop: "26px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: TOKENS.muted, marginBottom: "10px" }}>
          Your log today ({todaysCalls.length})
        </div>
        {todaysCalls.length === 0 && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13.5px", color: TOKENS.muted }}>Nothing logged yet today.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {todaysCalls.map((c) => (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${TOKENS.line}`, borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13.5px", color: TOKENS.ink, fontWeight: 500 }}>{c.school_name}</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <Stamp text={c.outcome} color={outcomeColor(c.outcome)} id={c.id} />
                {c.interested === true && <Stamp text="Interested" color={TOKENS.teal} id={c.id + "y"} />}
                {c.interested === false && <Stamp text="Not interested" color={TOKENS.red} id={c.id + "n"} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: TOKENS.paperCard, border: `1.5px solid ${TOKENS.line}`, borderRadius: "10px", padding: "16px 18px", flex: "1 1 150px" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: TOKENS.muted }}>{label}</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "28px", color: color || TOKENS.ink, marginTop: "4px" }}>{value}</div>
      {sub && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: TOKENS.muted, marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function ManageInterns({ interns, addIntern, removeIntern }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || pin.length < 4) {
      setError("Enter a name and a PIN of at least 4 digits.");
      return;
    }
    if (interns.some((i) => i.name.toLowerCase() === name.trim().toLowerCase())) {
      setError("That name is already on the list.");
      return;
    }
    setError("");
    const ok = await addIntern({ name: name.trim(), pin });
    if (!ok) {
      setError("Couldn't save — try again.");
      return;
    }
    setName("");
    setPin("");
  }

  return (
    <div style={{ background: TOKENS.paperCard, border: `1.5px solid ${TOKENS.line}`, borderRadius: "10px", padding: "16px 18px", marginBottom: "22px" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: TOKENS.muted }}>
          Manage interns ({interns.length})
        </span>
        <span style={{ color: TOKENS.muted, fontSize: "12px" }}>{open ? "Hide ▲" : "Show ▼"}</span>
      </button>
      {open && (
        <div style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            {interns.length === 0 && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: TOKENS.muted }}>No interns added yet.</div>}
            {interns.map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1px solid ${TOKENS.line}`, borderRadius: "6px", padding: "8px 12px" }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13.5px", color: TOKENS.ink }}>
                  {i.name} <span style={{ color: TOKENS.muted, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11.5px" }}>PIN: {i.pin}</span>
                </span>
                <button onClick={() => removeIntern(i.id)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.04em", textTransform: "uppercase", color: TOKENS.muted, background: "transparent", border: `1px solid ${TOKENS.line}`, borderRadius: "4px", padding: "3px 7px", cursor: "pointer" }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={submit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 140px" }}>
              <Field label="Intern name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya" />
              </Field>
            </div>
            <div style={{ flex: "1 1 100px" }}>
              <Field label="Set PIN">
                <TextInput value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit PIN" />
              </Field>
            </div>
            <button type="submit" style={{ marginBottom: "16px", padding: "10px 16px", borderRadius: "6px", border: "none", background: TOKENS.teal, color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "13.5px", cursor: "pointer" }}>
              Add
            </button>
          </form>
          {error && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "12.5px", color: TOKENS.red }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ calls, toggleFollowUp, deleteCall, interns, addIntern, removeIntern }) {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [internFilter, setInternFilter] = useState("");
  const [interestedFilter, setInterestedFilter] = useState("");
  const [followUpOnly, setFollowUpOnly] = useState(false);

  const total = calls.length;
  const connected = calls.filter((c) => c.outcome === "Connected").length;
  const interested = calls.filter((c) => c.interested === true).length;
  const today = todayStr();
  const dueFollowUps = calls.filter((c) => c.follow_up_needed && !c.follow_up_done && c.follow_up_date && c.follow_up_date <= today).length;

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), calls: 0 });
    }
    const map = Object.fromEntries(days.map((d) => [d.date, d]));
    calls.forEach((c) => {
      if (map[c.call_date]) map[c.call_date].calls += 1;
    });
    return days;
  }, [calls]);

  const filtered = useMemo(() => {
    return calls
      .filter((c) => (search ? c.school_name.toLowerCase().includes(search.toLowerCase()) : true))
      .filter((c) => (outcomeFilter ? c.outcome === outcomeFilter : true))
      .filter((c) => (internFilter ? c.logged_by === internFilter : true))
      .filter((c) => (interestedFilter === "yes" ? c.interested === true : interestedFilter === "no" ? c.interested === false : true))
      .filter((c) => (followUpOnly ? c.follow_up_needed && !c.follow_up_done && c.follow_up_date && c.follow_up_date <= today : true))
      .sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1));
  }, [calls, search, outcomeFilter, internFilter, interestedFilter, followUpOnly, today]);

  return (
    <div style={{ maxWidth: "1040px", margin: "0 auto", padding: "28px 20px 60px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" }}>
        <StatCard label="Total calls" value={total} />
        <StatCard label="Connected" value={connected} sub={total ? `${Math.round((connected / total) * 100)}% connect rate` : null} color={TOKENS.teal} />
        <StatCard label="Interested" value={interested} color={TOKENS.amber} />
        <StatCard label="Follow-ups due" value={dueFollowUps} color={dueFollowUps > 0 ? TOKENS.red : TOKENS.ink} />
      </div>

      <ManageInterns interns={interns} addIntern={addIntern} removeIntern={removeIntern} />

      <div style={{ background: TOKENS.paperCard, border: `1.5px solid ${TOKENS.line}`, borderRadius: "10px", padding: "18px", marginBottom: "22px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: TOKENS.muted, marginBottom: "10px" }}>
          Calls per day — last 14 days
        </div>
        <div style={{ width: "100%", height: 160 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={TOKENS.line} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: TOKENS.muted }} axisLine={{ stroke: TOKENS.line }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fontFamily: "IBM Plex Mono", fill: TOKENS.muted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: "12px", borderRadius: "6px", border: `1px solid ${TOKENS.line}` }} />
              <Bar dataKey="calls" fill={TOKENS.amber} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px", alignItems: "center" }}>
        <TextInput placeholder="Search school..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "170px" }} />
        <Select value={internFilter} onChange={(e) => setInternFilter(e.target.value)} style={{ width: "150px" }}>
          <option value="">All interns</option>
          {interns.map((i) => (
            <option key={i.id} value={i.name}>{i.name}</option>
          ))}
        </Select>
        <Select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)} style={{ width: "150px" }}>
          <option value="">All outcomes</option>
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
        <Select value={interestedFilter} onChange={(e) => setInterestedFilter(e.target.value)} style={{ width: "150px" }}>
          <option value="">Interested: all</option>
          <option value="yes">Interested: yes</option>
          <option value="no">Interested: no</option>
        </Select>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: TOKENS.ink, cursor: "pointer" }}>
          <input type="checkbox" checked={followUpOnly} onChange={(e) => setFollowUpOnly(e.target.checked)} />
          Follow-ups due
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.length === 0 && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13.5px", color: TOKENS.muted, padding: "20px 0" }}>No calls match these filters.</div>}
        {filtered.map((c) => (
          <div key={c.id} style={{ background: "#fff", border: `1px solid ${TOKENS.line}`, borderLeft: `3px solid ${outcomeColor(c.outcome)}`, borderRadius: "8px", padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "14.5px", color: TOKENS.ink }}>
                  {c.school_name}
                  {c.city && <span style={{ color: TOKENS.muted, fontWeight: 400, fontSize: "12.5px" }}> · {c.city}</span>}
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "12.5px", color: TOKENS.muted, marginTop: "2px" }}>
                  {fmtDate(c.call_date)} · logged by {c.logged_by || "—"}{c.whatsapp_shared ? " · WhatsApp profile shared" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <Stamp text={c.outcome} color={outcomeColor(c.outcome)} id={c.id} />
                {c.interested === true && <Stamp text="Interested" color={TOKENS.teal} id={c.id + "y"} />}
                {c.interested === false && <Stamp text="Not interested" color={TOKENS.red} id={c.id + "n"} />}
              </div>
            </div>
            {c.notes && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: TOKENS.ink, marginTop: "8px", lineHeight: 1.4 }}>{c.notes}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: !c.follow_up_needed ? TOKENS.muted : c.follow_up_done ? TOKENS.teal : c.follow_up_date && c.follow_up_date <= today ? TOKENS.red : TOKENS.muted }}>
                {!c.follow_up_needed ? "No follow-up needed" : `Follow-up${c.follow_up_date ? `: ${fmtDate(c.follow_up_date)}` : " needed"}${c.follow_up_done ? " — done" : ""}`}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {c.follow_up_needed && (
                  <button onClick={() => toggleFollowUp(c.id, !c.follow_up_done)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", letterSpacing: "0.04em", textTransform: "uppercase", color: TOKENS.teal, background: "transparent", border: `1px solid ${TOKENS.teal}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>
                    {c.follow_up_done ? "Mark pending" : "Mark done"}
                  </button>
                )}
                <button onClick={() => deleteCall(c.id)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10.5px", letterSpacing: "0.04em", textTransform: "uppercase", color: TOKENS.muted, background: "transparent", border: `1px solid ${TOKENS.line}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [calls, setCalls] = useState([]);
  const [interns, setInterns] = useState([]);
  const [adminCreds, setAdminCreds] = useState(null);
  const [loggedInName, setLoggedInName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function loadAll() {
    const [callsRes, internsRes, adminRes] = await Promise.all([
      supabase.from("calls").select("*").order("logged_at", { ascending: false }),
      supabase.from("interns").select("*").order("name"),
      supabase.from("admin_settings").select("*").eq("id", 1).single(),
    ]);
    if (callsRes.error || internsRes.error) {
      setLoadError("Couldn't connect to the database. Check your Supabase URL/key in .env.");
    } else {
      setCalls(callsRes.data || []);
      setInterns(internsRes.data || []);
      setAdminCreds(adminRes.data || null);
    }
    setLoaded(true);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addCall(record) {
    const { error } = await supabase.from("calls").insert([record]);
    if (error) return false;
    await loadAll();
    return true;
  }
  async function toggleFollowUp(id, done) {
    await supabase.from("calls").update({ follow_up_done: done }).eq("id", id);
    await loadAll();
  }
  async function deleteCall(id) {
    if (!window.confirm("Delete this call entry?")) return;
    await supabase.from("calls").delete().eq("id", id);
    await loadAll();
  }
  async function addIntern(intern) {
    const { error } = await supabase.from("interns").insert([intern]);
    if (error) return false;
    await loadAll();
    return true;
  }
  async function removeIntern(id) {
    if (!window.confirm("Remove this intern? They won't be able to log in until re-added.")) return;
    await supabase.from("interns").delete().eq("id", id);
    await loadAll();
  }

  function logout() {
    setLoggedInName("");
    setScreen("landing");
  }

  let headerRight = null;
  if (screen === "intern") {
    headerRight = (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>Logged in: {loggedInName}</span>
        <ChipButton onClick={logout}>Log Out</ChipButton>
      </div>
    );
  } else if (screen === "admin") {
    headerRight = <ChipButton onClick={logout}>Log Out</ChipButton>;
  }

  return (
    <div style={{ minHeight: "100vh", background: TOKENS.paper, fontFamily: "'Inter', sans-serif" }}>
      <HeaderBar right={headerRight} />
      {!loaded ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: TOKENS.muted }}>Loading log…</div>
      ) : loadError ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: TOKENS.red, fontFamily: "'Inter', sans-serif" }}>{loadError}</div>
      ) : (
        <>
          {screen === "landing" && <Landing goTo={setScreen} />}
          {screen === "internLogin" && (
            <InternLogin interns={interns} goTo={setScreen} onSuccess={(name) => { setLoggedInName(name); setScreen("intern"); }} />
          )}
          {screen === "adminLogin" && (
            <AdminLogin adminCreds={adminCreds} goTo={setScreen} onSuccess={() => setScreen("admin")} />
          )}
          {screen === "intern" && <InternForm calls={calls} addCall={addCall} loggedInName={loggedInName} />}
          {screen === "admin" && (
            <AdminDashboard calls={calls} toggleFollowUp={toggleFollowUp} deleteCall={deleteCall} interns={interns} addIntern={addIntern} removeIntern={removeIntern} />
          )}
        </>
      )}
    </div>
  );
}
