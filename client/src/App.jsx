import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, Droplet, LogOut, Plus, RefreshCw, Trash2, Pencil, HeartPulse } from 'lucide-react';
import { api } from './api';

const slots = [
  ['morning_fasting', 'Morning (fasting)'],
  ['after_breakfast', 'After breakfast'],
  ['after_lunch', 'After lunch'],
  ['after_dinner', 'After dinner'],
];
const today = new Date().toISOString().slice(0, 10);
const slotName = (key) => slots.find(([id]) => id === key)?.[1] || key;
const emptyForm = () => ({ readingDate: today, timeSlot: slots[0][0], glucoseValue: '' });

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('sweety_token') || '');
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [readings, setReadings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [reports, setReports] = useState({});
  const [activeReport, setActiveReport] = useState('daily');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadDashboard(currentToken = token, date = selectedDate) {
    const [me, list, daily, mtd, monthly] = await Promise.all([
      api('/auth/me', { token: currentToken }),
      api(`/readings?date=${date}`, { token: currentToken }),
      api(`/reports/daily?date=${date}`, { token: currentToken }),
      api(`/reports/month-to-date?date=${date}`, { token: currentToken }),
      api(`/reports/monthly?date=${date}`, { token: currentToken }),
    ]);
    setUser(me.user);
    setReadings(list.readings);
    setReports({ daily: daily.report, mtd: mtd.report, monthly: monthly.report });
  }

  useEffect(() => {
    if (!token) return;
    loadDashboard().catch((err) => {
      setError(err.message);
      if (err.message.toLowerCase().includes('session') || err.message.toLowerCase().includes('log in')) logout();
    });
  }, [token, selectedDate]);

  function logout() {
    localStorage.removeItem('sweety_token');
    setToken('');
    setUser(null);
    setReadings([]);
    setReports({});
  }

  async function submitAuth(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const result = await api(endpoint, { method: 'POST', body: JSON.stringify(auth) });
      localStorage.setItem('sweety_token', result.token);
      setToken(result.token); setMessage(result.message);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function submitReading(event) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    const payload = { ...form, glucoseValue: Number(form.glucoseValue) };
    try {
      if (editingId) await api(`/readings/${editingId}`, { token, method: 'PUT', body: JSON.stringify(payload) });
      else await api('/readings', { token, method: 'POST', body: JSON.stringify(payload) });
      setMessage(editingId ? 'Reading updated.' : 'Reading saved.');
      setForm(emptyForm()); setEditingId(null);
      await loadDashboard();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function editReading(reading) {
    setEditingId(reading.id);
    setForm({ readingDate: String(reading.readingDate).slice(0, 10), timeSlot: reading.timeSlot, glucoseValue: String(reading.glucoseValue) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteReading(id) {
    if (!window.confirm('Delete this glucose reading?')) return;
    setError(''); setMessage('');
    try { await api(`/readings/${id}`, { token, method: 'DELETE' }); setMessage('Reading deleted.'); await loadDashboard(); }
    catch (err) { setError(err.message); }
  }

  const report = reports[activeReport];
  const rangeLabel = report ? `${formatDate(report.startDate)}${report.startDate !== report.endDate ? ` – ${formatDate(report.endDate)}` : ''}` : '';
  const avg = report?.average == null ? '—' : Number(report.average).toFixed(1);

  if (!token || !user) {
    return <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark"><HeartPulse size={25} /></div>
        <p className="eyebrow">YOUR PERSONAL HEALTH COMPANION</p>
        <h1>Welcome to <span>Sweety</span></h1>
        <p className="muted">Keep your glucose readings organized, one day at a time.</p>
        <div className="tabs">
          <button className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => { setAuthMode('login'); setError(''); }}>Log in</button>
          <button className={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => { setAuthMode('register'); setError(''); }}>Create account</button>
        </div>
        <form onSubmit={submitAuth} className="form-stack">
          {authMode === 'register' && <label>Full name<input required minLength="2" value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="Your name" /></label>}
          <label>Email address<input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input required type="password" minLength="8" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 8 characters" /></label>
          {error && <p className="alert error">{error}</p>}
          <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
        <p className="tiny muted">Your health data is private to your account.</p>
      </section>
    </main>;
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark small"><HeartPulse size={20} /></div><span>Sweety</span></div>
      <div className="user-menu"><span className="avatar">{user.name?.[0]?.toUpperCase()}</span><span className="user-name">{user.name}</span><button className="icon-button" title="Log out" onClick={logout}><LogOut size={18}/></button></div>
    </header>
    <main className="main-content">
      <section className="welcome-row">
        <div><p className="eyebrow">GLUCOSE OVERVIEW</p><h1>Good day, {user.name?.split(' ')[0]} <span>👋</span></h1><p className="muted">A clear picture of your daily readings.</p></div>
        <label className="date-control"><CalendarDays size={18}/><input type="date" max={today} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /></label>
      </section>
      {(message || error) && <div className={`alert ${error ? 'error' : 'success'}`}>{error || message}<button onClick={() => { setError(''); setMessage(''); }}>×</button></div>}
      <section className="summary-grid">
        <SummaryCard icon={<Activity/>} label="Highest reading" value={report?.highest ?? '—'} unit="mg/dl" tone="peach"/>
        <SummaryCard icon={<Droplet/>} label="Lowest reading" value={report?.lowest ?? '—'} unit="mg/dl" tone="blue"/>
        <SummaryCard icon={<Activity/>} label="Average reading" value={avg} unit="mg/dl" tone="purple"/>
        <SummaryCard icon={<CalendarDays/>} label="Total readings" value={report?.readingCount ?? 0} unit="entries" tone="green"/>
      </section>
      <section className="content-grid">
        <div className="panel form-panel">
          <div className="panel-heading"><div><p className="eyebrow">RECORD A RESULT</p><h2>{editingId ? 'Edit reading' : 'Add glucose reading'}</h2></div><span className="soft-icon"><Plus size={20}/></span></div>
          <form onSubmit={submitReading} className="form-stack">
            <label>Date<input type="date" required max={today} value={form.readingDate} onChange={e => setForm({ ...form, readingDate: e.target.value })}/></label>
            <label>Time slot<select value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })}>{slots.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label>Glucose value (mg/dl)<div className="input-unit"><input type="number" required min="40" max="600" step="1" placeholder="e.g. 105" value={form.glucoseValue} onChange={e => setForm({ ...form, glucoseValue: e.target.value })}/><span>mg/dl</span></div></label>
            <p className="field-hint">Enter a whole number between 40 and 600.</p>
            <button className="primary full" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Update reading' : 'Save reading'}</button>
            {editingId && <button type="button" className="secondary full" onClick={() => { setEditingId(null); setForm(emptyForm()); }}>Cancel edit</button>}
          </form>
          <div className="slot-note"><strong>Daily limit</strong><span>{readings.length} of 4 readings recorded for selected date</span></div>
        </div>
        <div className="panel report-panel">
          <div className="panel-heading"><div><p className="eyebrow">YOUR INSIGHTS</p><h2>Reports</h2></div><RefreshCw size={18} className="muted-icon"/></div>
          <div className="report-tabs">
            <button className={activeReport === 'daily' ? 'selected' : ''} onClick={() => setActiveReport('daily')}>Daily</button>
            <button className={activeReport === 'mtd' ? 'selected' : ''} onClick={() => setActiveReport('mtd')}>Month to date</button>
            <button className={activeReport === 'monthly' ? 'selected' : ''} onClick={() => setActiveReport('monthly')}>Previous month</button>
          </div>
          <p className="range-label">{rangeLabel}</p>
          {activeReport === 'daily' ? <div className="reading-list">
            {readings.length === 0 ? <div className="empty"><Droplet size={28}/><strong>No readings yet</strong><span>Add your first reading for this date.</span></div> : readings.map(item => <div className="reading-row" key={item.id}><div className="reading-dot"/><div className="reading-info"><strong>{slotName(item.timeSlot)}</strong><span>{formatDate(item.readingDate)}</span></div><strong className="reading-value">{item.glucoseValue} <small>mg/dl</small></strong><button className="mini-icon" title="Edit" onClick={() => editReading(item)}><Pencil size={15}/></button><button className="mini-icon danger" title="Delete" onClick={() => deleteReading(item.id)}><Trash2 size={15}/></button></div>)}
          </div> : <div className="report-summary">
            {report?.readingCount ? <><div className="big-average">{avg}<small> mg/dl average</small></div><p>{report.readingCount} readings in this period</p><div className="minmax"><span>Lowest <b>{report.lowest} mg/dl</b></span><span>Highest <b>{report.highest} mg/dl</b></span></div></> : <div className="empty"><Activity size={28}/><strong>No readings in this period</strong><span>Your report will appear when readings are added.</span></div>}
          </div>}
        </div>
      </section>
      <footer className="footer-note">Sweety is a tracking tool, not a medical diagnosis service. Follow your healthcare professional's guidance.</footer>
    </main>
  </div>;
}

function SummaryCard({ icon, label, value, unit, tone }) {
  return <article className="summary-card"><div className={`summary-icon ${tone}`}>{icon}</div><p>{label}</p><div className="summary-value">{value}<small>{unit}</small></div></article>;
}
function formatDate(value) {
  if (!value) return '';
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
