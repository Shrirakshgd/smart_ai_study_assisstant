import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, BrainCircuit, Loader2, Send, Bot, LogOut, ArrowLeft, User, Mic, Volume2, VolumeX, Bookmark, History } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    
    if (noteId) {
      loadNote();
      loadHistory();
    }
  }, [navigate, noteId]);

  const loadNote = async () => {
    setIsLoadingNote(true);
    try {
      const res = await axios.post(`${API_URL}/load-note/${noteId}`);
      setFile({ name: res.data.title });
    } catch (error) {
      console.error("Failed to load note", error);
      alert("Failed to load note");
      navigate('/dashboard');
    } finally {
      setIsLoadingNote(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history/${noteId}`);
      setHistory(res.data);
      const histMessages = [];
      res.data.forEach(item => {
        histMessages.push({ role: 'user', content: item.question });
        histMessages.push({ role: 'ai', content: item.answer });
      });
      setMessages(histMessages);
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    
    recognition.start();
  };

  const speakAnswer = (text) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const toggleBookmark = async (queryId) => {
    try {
      await axios.post(`${API_URL}/bookmark-query/${queryId}`);
      loadHistory();
    } catch(err) {
      console.error("Failed to bookmark", err);
    }
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
      loadHistory(); 
    } catch (error) {
      console.error("Ask error", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't get an answer right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateSummary = async () => {
    setIsProcessingTool(true);
    try {
      const res = await axios.post(`${API_URL}/summarize`);
      setSummary(res.data.summary);
    } catch (error) {
      console.error(error);
      alert("Failed to generate summary");
    } finally {
      setIsProcessingTool(false);
    }
  };

  const generateQuiz = async () => {
    setIsProcessingTool(true);
    try {
      const res = await axios.post(`${API_URL}/quiz`, { num_questions: 5 });
      setQuiz(res.data.quiz);
    } catch (error) {
      console.error(error);
      alert("Failed to generate quiz");
    } finally {
      setIsProcessingTool(false);
    }
  };

  if (isLoadingNote) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="loader" size={48} color="var(--accent-primary)" />
        <h2 style={{ marginLeft: '1rem' }}>Loading Study Assistant...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header" style={{ position: 'relative' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ position: 'absolute', left: 0, top: 0, padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ position: 'absolute', right: 0, top: 0, padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Logout
        </button>
        <h1>Smart AI Study Assistant</h1>
        <p>Studying Note: <strong>{file?.name}</strong></p>
      </div>

      <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-panel study-tools">
          <h3>Study Tools</h3>
          <div className="tool-actions">
            <button className="btn" onClick={generateSummary} disabled={isProcessingTool}>
              <FileText size={20} /> Generate Summary
            </button>
            <button className="btn btn-secondary" onClick={generateQuiz} disabled={isProcessingTool}>
              <BrainCircuit size={20} /> Generate Quiz
            </button>
            <button className="btn btn-secondary" onClick={() => {
              setIsVoiceEnabled(!isVoiceEnabled);
              if (isVoiceEnabled) window.speechSynthesis.cancel();
            }}>
              {isVoiceEnabled ? <><Volume2 size={20} /> Voice Enabled</> : <><VolumeX size={20} /> Voice Disabled</>}
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}><History size={18} /> Query History</h3>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No history yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {history.map((h, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Q: {h.question}</p>
                    <button onClick={() => toggleBookmark(h.id)} style={{ background: 'none', border: 'none', color: h.is_bookmarked ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                      <Bookmark size={16} fill={h.is_bookmarked ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{h.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="glass-panel chat-container">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', color: 'var(--text-secondary)' }}>
                <BrainCircuit size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Start interacting with your AI tutor about this note.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`message-wrapper ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`message ${msg.role}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-wrapper ai">
                <div className="message-avatar">
                  <Bot size={20} />
                </div>
                <div className="message ai">
                  <Loader2 className="loader" size={16} /> Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input" onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={startListening} 
              style={{ padding: '0.75rem', background: isListening ? 'rgba(239, 68, 68, 0.2)' : '', color: isListening ? '#ef4444' : '' }}
            >
              <Mic size={20} className={isListening ? 'pulse' : ''} />
            </button>
            <input 
              type="text" 
              placeholder="Ask a question about this note..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn" disabled={!input.trim() || isTyping}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
      
      {summary && (
        <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '2rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText color="var(--accent-primary)" /> Document Summary
            </h2>
            <button className="btn btn-secondary" onClick={() => setSummary(null)}>Close</button>
          </div>
          <div style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {summary}
          </div>
        </div>
      )}

      {quiz && (
        <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '2rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit color="var(--accent-secondary)" /> Practice Quiz
            </h2>
            <button className="btn btn-secondary" onClick={() => setQuiz(null)}>Close</button>
          </div>
          <div style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {quiz}
          </div>
        </div>
      )}
    </div>
  );
}
