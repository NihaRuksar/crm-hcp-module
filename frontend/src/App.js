import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import FormPanel from './components/FormPanel';
import ChatPanel from './components/ChatPanel';
import './App.css';

function AppContent() {
  const [activeNav, setActiveNav] = useState('log');

  return (
    <div className="app">
      {/* TOP NAV */}
      <nav className="topnav">
        <div className="nav-left">
          <div className="nav-logo">
            <span className="logo-dot" />
            AIVOA CRM
          </div>
          <span className="nav-badge">HCP Module</span>
        </div>
        <div className="nav-center">
          {[
            { id: 'log', label: 'Log Interaction' },
            { id: 'history', label: 'All Interactions' },
            { id: 'hcps', label: 'HCP Directory' },
          ].map(item => (
            <button key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <div className="nav-avatar">SR</div>
        </div>
      </nav>

      {/* SIDEBAR + CONTENT */}
      <div className="main-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Actions</div>
            {[
              { icon: '📝', label: 'Log Interaction', active: true },
              { icon: '📋', label: 'All Interactions' },
              { icon: '👥', label: 'HCP Directory' },
              { icon: '📅', label: 'Follow-ups' },
            ].map((item, i) => (
              <div key={i} className={`sidebar-item ${item.active ? 'active' : ''}`}>
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Analytics</div>
            {[
              { icon: '📈', label: 'Sentiment Trends' },
              { icon: '🗺️', label: 'Territory Map' },
              { icon: '📊', label: 'Reports' },
            ].map((item, i) => (
              <div key={i} className="sidebar-item">
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">LangGraph Tools</div>
            {[
              { label: 'log_interaction', color: '#4f46e5' },
              { label: 'edit_interaction', color: '#0891b2' },
              { label: 'fetch_hcp_profile', color: '#059669' },
              { label: 'schedule_followup', color: '#d97706' },
              { label: 'analyze_sentiment', color: '#dc2626' },
            ].map((t, i) => (
              <div key={i} className="sidebar-tool">
                <span className="tool-dot" style={{ background: t.color }} />
                {t.label}
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="content-area">
          <div className="content-header">
            <div>
              <h1 className="page-title">Log HCP Interaction</h1>
              <p className="page-sub">Use the AI Assistant on the right — it fills the form automatically</p>
            </div>
          </div>

          {/* SPLIT SCREEN */}
          <div className="split-screen">
            <FormPanel />
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
