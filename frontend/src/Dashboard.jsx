import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Trash2, LogOut, Upload, Loader2, Plus, BarChart3, Bookmark, MessageSquare } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000';

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/notes`),
        axios.get(`${API_URL}/dashboard-stats`)
      ]);
      setNotes(notesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/study/${res.data.note_id}`);
    } catch (error) {
      console.error(error);
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
      setIsUploading(false);
    }
  };

  const handleDelete = async (noteId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    try {
      await axios.delete(`${API_URL}/notes/${noteId}`);
      fetchData(); // refresh everything
    } catch (error) {
      console.error("Failed to delete note", error);
      alert("Failed to delete note");
    }
  };

  const toggleBookmark = async (noteId, e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_URL}/bookmark-note/${noteId}`);
      fetchData();
    } catch(err) {
      console.error("Failed to bookmark note", err);
    }
  };

  const openStudyMode = (noteId) => {
    navigate(`/study/${noteId}`);
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="loader" size={48} color="var(--accent-primary)" />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
      <div className="header" style={{ position: 'relative', paddingBottom: '2rem' }}>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ position: 'absolute', right: '2rem', top: '2rem', padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Logout
        </button>
        <h1>Study Dashboard</h1>
        <p>Manage your uploaded documents, view analytics, and study notes.</p>
      </div>

      <div style={{ padding: '0 2rem 2rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Analytics Section */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                <FileText size={24} color="var(--accent-primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '2rem' }}>{stats.total_notes}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Notes</p>
              </div>
            </div>
            
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                <MessageSquare size={24} color="var(--accent-secondary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '2rem' }}>{stats.total_queries}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Queries Asked</p>
              </div>
            </div>

            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ background: 'rgba(234, 179, 8, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                <Bookmark size={24} color="#eab308" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '2rem' }}>{stats.bookmarked_notes}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Bookmarked Notes</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Your Notes ({notes.length})</h2>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              id="file-upload-dashboard" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
              accept=".pdf,.txt"
            />
            <label htmlFor="file-upload-dashboard" className="btn" style={{ cursor: 'pointer', display: 'flex', gap: '8px' }}>
              {isUploading ? <Loader2 className="loader" size={20} /> : <Plus size={20} />}
              {isUploading ? 'Extracting NLP Keywords...' : 'Upload New Note'}
            </label>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <FileText size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h3>No notes yet</h3>
            <p>Upload a PDF or TXT file to start studying.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {notes.map(note => (
              <div 
                key={note.id} 
                className="glass-panel note-card" 
                onClick={() => openStudyMode(note.id)}
                style={{ cursor: 'pointer', position: 'relative', transition: 'transform 0.2s', padding: '1.5rem' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', paddingRight: '4rem' }}>{note.title}</h3>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={(e) => toggleBookmark(note.id, e)}
                      style={{ background: 'none', border: 'none', color: note.is_bookmarked ? '#eab308' : 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <Bookmark size={20} fill={note.is_bookmarked ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(note.id, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {note.category}
                  </div>
                  {note.keywords && note.keywords.split(',').map((kw, i) => (
                    <div key={i} style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                      {kw.trim()}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
