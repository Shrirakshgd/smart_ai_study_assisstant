import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText, BrainCircuit, Loader2, Send, Bot, LogOut,
  ArrowLeft, User, Mic, Volume2, VolumeX, Bookmark, History, Zap, ChevronRight
} from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000';

axios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers['Authorization'] = 'Bearer ' + t;
  return cfg;
}, err => Promise.reject(err));

// ── XP helpers ──
function addXP(amount) {
  const current = parseInt(localStorage.getItem('study_xp') || '0');
  localStorage.setItem('study_xp', current + amount);
}

function XPToast({ amount, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return <div className="xp-toast">⚡ +{amount} XP</div>;
}

export default function App() {
  const { noteId } = useParams();
  const [file, setFile] = useState(null);
  const [isLoadingNote, setIsLoadingNote] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [summary, setSummary] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [isProcessingTool, setIsProcessingTool] = useState(false);
  const [history, setHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'history'
  const [xpToasts, setXpToasts] = useState([]);
  const [showModal, setShowModal] = useState(null); // 'summary' | 'quiz'

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'S';
  const xp = parseInt(localStorage.getItem('study_xp') || '0');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    if (noteId) { loadNote(); loadHistory(); }
  }, [noteId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const showXP = (amount) => {
    const id = Date.now();
    setXpToasts(prev => [...prev, { id, amount }]);
  };

  const loadNote = async () => {
    setIsLoadingNote(true);
    try {
      const res = await axios.post(`${API_URL}/load-note/${noteId}`);
      setFile({ name: res.data.title });
      localStorage.setItem('last_note_id', noteId);
      localStorage.setItem('last_note_title', res.data.title);
    } catch {
      alert('Failed to load note');
      navigate('/dashboard');
    } finally {
      setIsLoadingNote(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history/${noteId}`);
      setHistory(res.data);
      const msgs = [];
      res.data.forEach(item => {
        msgs.push({ role: 'user', content: item.question });
        msgs.push({ role: 'ai', content: item.answer });
      });
      setMessages(msgs);
    } catch { /* silent */ }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech Recognition requires Chrome.'); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onresult = (e) => setInput(e.results[0][0].transcript);
    r.start();
  };

  const speakAnswer = (text) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const toggleBookmark = async (qId) => {
    try { await axios.post(`${API_URL}/bookmark-query/${qId}`); loadHistory(); }
    catch { /* silent */ }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);
    try {
      const res = await axios.post(`${API_URL}/ask`, { question: userMsg, note_id: parseInt(noteId) });
      const answer = res.data.answer;
      setMessages(prev => [...prev, { role: 'ai', content: answer }]);
      speakAnswer(answer);
      addXP(10); showXP(10);
      loadHistory();
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, couldn't get an answer right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateSummary = async () => {
    setIsProcessingTool(true);
    try {
      const res = await axios.post(`${API_URL}/summarize`);
      setSummary(res.data.summary);
      setShowModal('summary');
      addXP(30); showXP(30);
    } catch { alert('Failed to generate summary'); }
    finally { setIsProcessingTool(false); }
  };

  const generateQuiz = async () => {
    setIsProcessingTool(true);
    try {
      const res = await axios.post(`${API_URL}/quiz`, { num_questions: 5 });
      setQuiz(res.data.quiz);
      setShowModal('quiz');
      addXP(20); showXP(20);
    } catch { alert('Failed to generate quiz'); }
    finally { setIsProcessingTool(false); }
  };

  if (isLoadingNote) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
      <Loader2 size={36} color="var(--neon-violet)" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading your note...</span>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>

      {/* XP Toasts */}
      {xpToasts.map(t => (
        <XPToast key={t.id} amount={t.amount} onDone={() => setXpToasts(prev => prev.filter(x => x.id !== t.id))} />
      ))}

      {/* ── Top Header ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1.5rem', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(14px)', background: 'rgba(9,9,15,0.75)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button id="back-btn" className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ padding: '6px 12px' }}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)' }} />
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file?.name}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="badge badge-cyan"><Zap size={11} /> {xp} XP</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--neon-violet),var(--neon-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '0.8rem' }}>
            {username[0].toUpperCase()}
          </div>
          <button className="btn btn-ghost" onClick={() => { localStorage.removeItem('token'); navigate('/'); }} style={{ padding: '6px 10px' }}>
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', padding: '1.5rem', maxWidth: 1300, margin: '0 auto', width: '100%', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
            {['tools', 'history'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '7px 0', border: 'none', borderRadius: 9, fontFamily: 'Inter, sans-serif',
                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s ease',
                background: activeTab === tab ? 'linear-gradient(135deg, var(--neon-violet), #6d28d9)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                boxShadow: activeTab === tab ? '0 2px 10px rgba(168,85,247,0.35)' : 'none',
              }}>
                {tab === 'tools' ? '🛠 Tools' : '📋 History'}
              </button>
            ))}
          </div>

          {/* Tools Panel */}
          {activeTab === 'tools' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Study Tools</h3>
              <button id="summary-btn" className="btn" onClick={generateSummary} disabled={isProcessingTool} style={{ justifyContent: 'flex-start', width: '100%' }}>
                {isProcessingTool ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
                Generate Summary
                <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.68rem', padding: '2px 8px' }}>+30 XP</span>
              </button>
              <button id="quiz-btn" className="btn btn-secondary" onClick={generateQuiz} disabled={isProcessingTool} style={{ justifyContent: 'flex-start', width: '100%' }}>
                {isProcessingTool ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <BrainCircuit size={16} />}
                Generate Quiz
                <span className="badge badge-amber" style={{ marginLeft: 'auto', fontSize: '0.68rem', padding: '2px 8px' }}>+20 XP</span>
              </button>
              <button id="voice-btn" className="btn btn-secondary" onClick={() => { setIsVoiceEnabled(!isVoiceEnabled); if (isVoiceEnabled) window.speechSynthesis?.cancel(); }} style={{ justifyContent: 'flex-start', width: '100%' }}>
                {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {isVoiceEnabled ? 'Voice On' : 'Voice Off'}
              </button>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                💡 <strong style={{ color: 'var(--text-secondary)' }}>Tip:</strong> Ask specific questions for better answers. You earn <span style={{ color: 'var(--neon-cyan)' }}>+10 XP</span> per question!
              </div>
            </div>
          )}

          {/* History Panel */}
          {activeTab === 'history' && (
            <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={15} color="var(--neon-violet)" /> Query History
                </h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {history.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', paddingTop: '2rem' }}>No history yet. Ask a question!</p>
                  : history.map((h, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '0.85rem', marginBottom: '0.75rem', border: '1px solid var(--border)', transition: 'border-color 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>Q: {h.question}</p>
                        <button onClick={() => toggleBookmark(h.id)} style={{ background: 'none', border: 'none', color: h.is_bookmarked ? 'var(--neon-amber)' : 'var(--text-muted)', cursor: 'pointer', flexShrink: 0, padding: '0 0 0 6px' }}>
                          <Bookmark size={14} fill={h.is_bookmarked ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>{h.answer}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Chat Area ── */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          {/* Chat Header */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(168,85,247,0.12)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(168,85,247,0.2)' }}>
              <Bot size={18} color="var(--neon-violet)" />
            </div>
            <div>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>AI Tutor</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--neon-green)' }}>● Online</p>
            </div>
            <div className="badge badge-violet" style={{ marginLeft: 'auto', gap: 4 }}>
              <Zap size={11} /> +10 XP per question
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BrainCircuit size={60} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, marginBottom: '0.4rem' }}>Ask your AI Tutor anything!</p>
                <p style={{ fontSize: '0.85rem' }}>Every question earns you XP. Start studying! 🚀</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`message-wrapper ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} color="var(--neon-cyan)" />}
                </div>
                <div className={`message ${msg.role}`}>{msg.content}</div>
              </div>
            ))}
            {isTyping && (
              <div className="message-wrapper ai">
                <div className="message-avatar"><Bot size={16} color="var(--neon-cyan)" /></div>
                <div className="message ai">
                  <div className="typing-dots" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button type="button" id="mic-btn" onClick={startListening} style={{
              width: 44, height: 44, borderRadius: 12, border: `1px solid ${isListening ? 'rgba(239,68,68,0.6)' : 'var(--border)'}`,
              background: isListening ? 'rgba(239,68,68,0.1)' : 'var(--bg-surface)',
              color: isListening ? '#f87171' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
              boxShadow: isListening ? '0 0 12px rgba(239,68,68,0.3)' : 'none',
            }}>
              <Mic size={18} />
            </button>
            <input
              id="chat-input"
              type="text"
              placeholder="Ask a question... (+10 XP)"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ flex: 1, height: 44, borderRadius: 12, paddingLeft: '1rem', fontSize: '0.9rem' }}
            />
            <button id="send-btn" type="submit" className="btn" disabled={!input.trim() || isTyping} style={{ height: 44, width: 44, padding: 0, justifyContent: 'center', borderRadius: 12 }}>
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Modals (Summary / Quiz) ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(null); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 800, maxHeight: '75vh', display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.35s ease', marginBottom: '1rem' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                {showModal === 'summary' ? <><FileText size={18} color="var(--neon-violet)" /> Document Summary</> : <><BrainCircuit size={18} color="var(--neon-cyan)" /> Practice Quiz</>}
              </h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(null)} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>✕ Close</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {showModal === 'summary' ? summary : quiz}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
