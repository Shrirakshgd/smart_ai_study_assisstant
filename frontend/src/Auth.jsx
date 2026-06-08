import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BrainCircuit, Loader2, User, Mail, Lock, ArrowRight } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        navigate('/dashboard');
      } else {
        await axios.post(`${API_URL}/register`, { username, email, password });
        alert('Registration successful! Please login.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (error) {
      console.error("Auth error", error);
      alert(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container auth-container">
      <div className="glass-panel auth-panel">
        <BrainCircuit size={56} className="pulse-icon" style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }} />
        
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Join the Future'}</h2>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Enter your details to access your smart study assistant.' 
            : 'Create an account to start your AI-powered study journey.'}
        </p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group" style={{ animationDelay: '0.1s' }}>
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          
          {!isLogin && (
            <div className="input-group" style={{ animationDelay: '0.2s' }}>
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div className="input-group" style={{ animationDelay: isLogin ? '0.2s' : '0.3s' }}>
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn auth-btn" style={{ animationDelay: isLogin ? '0.3s' : '0.4s' }} disabled={loading}>
            {loading ? <Loader2 className="loader" size={20} /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={{ marginTop: '2.5rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600', transition: 'color 0.3s ease' }} 
            onClick={() => setIsLogin(!isLogin)}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-secondary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--accent-primary)'}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}
