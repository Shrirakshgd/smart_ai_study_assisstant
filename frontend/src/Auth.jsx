import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { BrainCircuit, Loader2, User, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000';

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

const QUOTES = [
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteKey, setQuoteKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length);
      setQuoteKey(k => k + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        const res = await axios.post(`${API_URL}/login`, params);
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('username', username);
        updateStreak();
        navigate('/dashboard');
      } else {
        await axios.post(`${API_URL}/register`, { username, email, password });
        alert('Registration successful! Please login.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastStudy = localStorage.getItem('last_study_date');
    const streak = parseInt(localStorage.getItem('study_streak') || '0');
    if (lastStudy === today) {
      // same day, no change
    } else if (lastStudy === new Date(Date.now() - 86400000).toDateString()) {
      localStorage.setItem('study_streak', streak + 1);
    } else {
      localStorage.setItem('study_streak', 1);
    }
    localStorage.setItem('last_study_date', today);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const res = await axios.post(`${API_URL}/auth/google`, {
          access_token: tokenResponse.access_token,
        });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('username', res.data.username);
        updateStreak();
        navigate('/dashboard');
      } catch (err) {
        alert(err.response?.data?.detail || 'Google login failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => alert('Google sign-in was cancelled or failed.'),
  });

  const q = QUOTES[quoteIdx];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', zIndex: 1 }}>
      {/* Left Panel — Quotes */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: '3rem', position: 'relative',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }} className="auth-left-panel">
        {/* Floating orbs */}
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'var(--neon-violet)', filter: 'blur(80px)', opacity: 0.12, top: '10%', left: '15%', animation: 'orbFloat 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'var(--neon-cyan)', filter: 'blur(70px)', opacity: 0.1, bottom: '15%', right: '10%', animation: 'orbFloat 12s ease-in-out infinite', animationDelay: '-4s' }} />
        <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: 'var(--neon-pink)', filter: 'blur(50px)', opacity: 0.1, top: '60%', left: '40%', animation: 'orbFloat 8s ease-in-out infinite', animationDelay: '-2s' }} />

        <div style={{ maxWidth: 420, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: '3rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, var(--neon-violet), #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(168,85,247,0.5)' }}>
              <BrainCircuit size={28} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>NexLearn</span>
          </div>

          {/* Quote */}
          <div key={quoteKey} style={{ animation: 'quoteFade 0.6s ease' }}>
            <div style={{ fontSize: '2.8rem', marginBottom: '1.2rem', lineHeight: 1 }}>💡</div>
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.45, marginBottom: '1.2rem' }}>
              "{q.text}"
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>— {q.author}</p>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: '2.5rem' }}>
            {QUOTES.map((_, i) => (
              <div key={i} onClick={() => { setQuoteIdx(i); setQuoteKey(k => k + 1); }}
                style={{
                  height: 8, borderRadius: 4, cursor: 'pointer', transition: 'all 0.3s ease',
                  width: i === quoteIdx ? 28 : 8,
                  background: i === quoteIdx ? 'var(--neon-violet)' : 'rgba(255,255,255,0.15)',
                  boxShadow: i === quoteIdx ? '0 0 8px var(--neon-violet)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Social proof */}
          <div style={{ marginTop: '3.5rem', display: 'flex', justifyContent: 'center', gap: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[['🔥', '10K+', 'Students'], ['⚡', '500K+', 'Queries'], ['📚', '50K+', 'Notes']].map(([icon, num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{icon}</div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 800 }}>{num}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: 420, padding: '2.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,var(--neon-violet),#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(168,85,247,0.4)' }}>
              <BrainCircuit size={22} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>NexLearn</span>
          </div>

          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            {isLogin ? 'Welcome back 👋' : 'Join the future 🚀'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
            {isLogin ? 'Sign in to continue your study streak.' : 'Create a free account to get started.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Username */}
            <div style={{ position: 'relative' }}>
              <User size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 2 }} />
              <input id="auth-username" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={{ paddingLeft: 42, height: 50 }} />
            </div>

            {/* Email (register only) */}
            {!isLogin && (
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 2 }} />
                <input id="auth-email" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: 42, height: 50 }} />
              </div>
            )}

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 2 }} />
              <input id="auth-password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: 42, height: 50 }} />
            </div>

            <button id="auth-submit" type="submit" className="btn" style={{ height: 50, fontSize: '1rem', justifyContent: 'center', marginTop: '0.4rem' }} disabled={loading}>
              {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : (
                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          {/* ── Divider ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.2rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* ── Google Button ── */}
          <button
            id="google-login-btn"
            type="button"
            onClick={() => googleLogin()}
            disabled={googleLoading}
            style={{
              width: '100%', height: 50, borderRadius: 12, border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.25s ease', opacity: googleLoading ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {googleLoading
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : GOOGLE_ICON
            }
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {isLogin && (
            <div style={{ marginTop: '1.2rem', padding: '0.9rem 1rem', background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="var(--neon-violet)" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Earn XP for every question you ask!</span>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.8rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span id="auth-toggle" onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--neon-violet)', cursor: 'pointer', fontWeight: 600, transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.target.style.color = 'var(--neon-cyan)'}
              onMouseLeave={e => e.target.style.color = 'var(--neon-violet)'}>
              {isLogin ? 'Register' : 'Login'}
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
        @media(max-width:768px){.auth-left-panel{display:none!important;}}
      `}</style>
    </div>
  );
}
