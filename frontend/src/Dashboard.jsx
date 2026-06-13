import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Trash2, LogOut, Loader2, Plus, Bookmark, MessageSquare, ChevronRight, Zap, Trophy, BrainCircuit } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000';

axios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers['Authorization'] = 'Bearer ' + t;
  return cfg;
}, err => Promise.reject(err));

const LEVEL_NAMES = ['Novice','Learner','Scholar','Expert','Master','Legend'];
function getLevel(xp) { return Math.min(Math.floor(xp / 100), LEVEL_NAMES.length - 1); }
function getLevelName(xp) { return LEVEL_NAMES[getLevel(xp)]; }
function getXpProgress(xp) { return ((xp % 100) / 100) * 100; }

const GREETINGS = ['Ready to level up today?', 'Keep the momentum going!', "Let's crush it today!", 'Your brain is your superpower 🧠', 'Knowledge is your XP ⚡'];

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'Student';
  const streak = parseInt(localStorage.getItem('study_streak') || '0');
  const xp = parseInt(localStorage.getItem('study_xp') || '0');
  const lastNoteId = localStorage.getItem('last_note_id');
  const lastNoteTitle = localStorage.getItem('last_note_title');
  const greeting = GREETINGS[new Date().getDay() % GREETINGS.length];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [notesRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/notes`),
        axios.get(`${API_URL}/dashboard-stats`)
      ]);
      setNotes(notesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/'); };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const res = await axios.post(`${API_URL}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/study/${res.data.note_id}`);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
      setIsUploading(false);
    }
  };

  const handleDelete = async (noteId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note?')) return;
    try { await axios.delete(`${API_URL}/notes/${noteId}`); fetchData(); }
    catch { alert('Failed to delete note'); }
  };

  const toggleBookmark = async (noteId, e) => {
    e.stopPropagation();
    try { await axios.post(`${API_URL}/bookmark-note/${noteId}`); fetchData(); }
    catch { console.error('bookmark failed'); }
  };

  const openNote = (note) => {
    localStorage.setItem('last_note_id', note.id);
    localStorage.setItem('last_note_title', note.title);
    navigate(`/study/${note.id}`);
  };

  const CARD_COLORS = ['#a855f7','#22d3ee','#f472b6','#4ade80','#fbbf24','#f87171'];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
      <Loader2 size={40} color="var(--neon-violet)" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontFamily: 'Sora, sans-serif' }}>Loading your workspace...</p>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>

      {/* ── Sticky Header ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 2rem', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(14px)', background: 'rgba(9,9,15,0.7)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,var(--neon-violet),#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.05rem' }}>NexLearn</span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-violet)', animation: 'dotPulse 2s ease-in-out infinite' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {streak > 0 && (
            <div className="streak-badge">
              <span className="fire-icon">🔥</span> {streak} day streak
            </div>
          )}
          {/* XP block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, minWidth: 110 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} color="var(--neon-cyan)" />
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.75rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>Lv.{getLevel(xp)} {getLevelName(xp)}</span>
            </div>
            <div className="xp-bar-track" style={{ width: 110 }}>
              <div className="xp-bar-fill" style={{ width: `${getXpProgress(xp)}%` }} />
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{xp % 100}/100 XP</span>
          </div>
          {/* Avatar */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--neon-violet),var(--neon-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '0.85rem', boxShadow: '0 0 12px rgba(168,85,247,0.4)' }}>
            {username[0].toUpperCase()}
          </div>
          <button id="logout-btn" className="btn-ghost btn" onClick={handleLogout} style={{ padding: '8px 12px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Welcome + Quick Resume */}
        <div style={{ display: 'grid', gridTemplateColumns: lastNoteId ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.5rem' }}>
              Hey, {username} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{greeting}</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-violet"><Trophy size={12} /> {getLevelName(xp)}</span>
              <span className="badge badge-cyan"><Zap size={12} /> {xp} XP total</span>
              {streak > 0 && <span className="badge badge-pink">🔥 {streak}-day streak</span>}
            </div>
          </div>

          {lastNoteId && lastNoteTitle && (
            <div className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer', border: '1px solid var(--border-accent)', transition: 'all 0.25s ease' }}
              onClick={() => navigate(`/study/${lastNoteId}`)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(168,85,247,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(168,85,247,0.12)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={24} color="var(--neon-violet)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Continue where you left off</p>
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{lastNoteTitle}</p>
              </div>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          )}
        </div>

        {/* Stats Row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem' }}>
            {[
              { icon: <FileText size={22} color="var(--neon-violet)" />, num: stats.total_notes, label: 'Total Notes', bg: 'rgba(168,85,247,0.12)', color: 'var(--neon-violet)' },
              { icon: <MessageSquare size={22} color="var(--neon-cyan)" />, num: stats.total_queries, label: 'Queries Asked', bg: 'rgba(34,211,238,0.1)', color: 'var(--neon-cyan)' },
              { icon: <Bookmark size={22} color="var(--neon-pink)" />, num: stats.bookmarked_notes, label: 'Bookmarked', bg: 'rgba(244,114,182,0.1)', color: 'var(--neon-pink)' },
            ].map(({ icon, num, label, bg, color }) => (
              <div key={label} className="glass-panel hoverable" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', padding: '1.4rem' }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 16px ${bg}` }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: 800, lineHeight: 1, color }}>{num}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.15rem', fontWeight: 700 }}>Your Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({notes.length})</span></h2>
            <div style={{ position: 'relative' }}>
              <input type="file" id="file-upload-dashboard" style={{ display: 'none' }} onChange={handleFileUpload} accept=".pdf,.txt" />
              <label htmlFor="file-upload-dashboard" className="btn" style={{ cursor: 'pointer' }}>
                {isUploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isUploading ? 'Processing...' : 'Upload Note'}
              </label>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem', border: '2px dashed var(--border)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>No notes yet!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Upload your first PDF or TXT to start earning XP.</p>
              <label htmlFor="file-upload-dashboard" className="btn" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <Plus size={18} /> Upload Your First Note
              </label>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
              {notes.map((note, idx) => (
                <div key={note.id} onClick={() => openNote(note)}
                  style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderTop: `3px solid ${CARD_COLORS[idx % CARD_COLORS.length]}`, borderRadius: 18, padding: '1.5rem', cursor: 'pointer', position: 'relative', transition: 'all 0.25s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 12px 35px rgba(0,0,0,0.3), 0 0 20px ${CARD_COLORS[idx % CARD_COLORS.length]}22`; e.currentTarget.style.borderColor = CARD_COLORS[idx % CARD_COLORS.length]; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}>

                  {/* Action buttons */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.4rem' }}>
                    <button onClick={e => toggleBookmark(note.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.is_bookmarked ? 'var(--neon-amber)' : 'var(--text-muted)', transition: 'color 0.2s', padding: 4 }}>
                      <Bookmark size={17} fill={note.is_bookmarked ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={e => handleDelete(note.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s', padding: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${CARD_COLORS[idx % CARD_COLORS.length]}1a`, border: `1px solid ${CARD_COLORS[idx % CARD_COLORS.length]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <FileText size={20} color={CARD_COLORS[idx % CARD_COLORS.length]} />
                  </div>

                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', paddingRight: '3rem' }}>{note.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {note.category && (
                      <span style={{ background: `${CARD_COLORS[idx % CARD_COLORS.length]}1a`, color: CARD_COLORS[idx % CARD_COLORS.length], padding: '3px 10px', borderRadius: 100, fontSize: '0.74rem', fontWeight: 600, border: `1px solid ${CARD_COLORS[idx % CARD_COLORS.length]}33` }}>
                        {note.category}
                      </span>
                    )}
                    {note.keywords && note.keywords.split(',').slice(0, 3).map((kw, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: 100, fontSize: '0.74rem', border: '1px solid var(--border)' }}>
                        {kw.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
