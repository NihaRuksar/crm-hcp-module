import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setFormField, setSentiment, addMaterial, removeMaterial,
  addSample, removeSample, clearForm, saveInteraction,
} from '../store';
import { saveInteraction as saveInteractionAPI } from '../services/api';
import { addMessage } from '../store';

export default function FormPanel() {
  const dispatch = useDispatch();
  const { formData, isAIFilled, formStatus, currentInteractionId } = useSelector(s => s.interaction);

  const highlight = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('field-highlight');
    void el.offsetWidth;
    el.classList.add('field-highlight');
    setTimeout(() => el.classList.remove('field-highlight'), 1500);
  };

  const handleSubmit = async () => {
    if (!formData.hcp) {
      dispatch(addMessage({
        id: Date.now(), role: 'ai',
        text: '⚠️ Please describe an HCP interaction first so I can fill the form.',
        toolUsed: null, timestamp: now(), fields: null,
      }));
      return;
    }
    try {
      const result = await saveInteractionAPI(formData);
      dispatch(saveInteraction(result.id));
      dispatch(addMessage({
        id: Date.now(), role: 'ai',
        text: `✅ Interaction with **${formData.hcp}** successfully logged to database! ID: #${result.id}`,
        toolUsed: 'log_interaction', timestamp: now(), fields: null,
      }));
    } catch (e) {
      dispatch(addMessage({
        id: Date.now(), role: 'ai',
        text: `⚠️ Could not save to database. Check backend is running at port 8000.`,
        toolUsed: null, timestamp: now(), fields: null,
      }));
    }
  };

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const statusColor = { draft: '#9ca3af', ai_filled: '#4f46e5', edited: '#f59e0b', saved: '#10b981' };
  const statusLabel = { draft: 'Draft', ai_filled: 'AI Filled', edited: 'Edited', saved: 'Saved ✓' };

  return (
    <div className="form-panel">
      <div className="form-card">
        {/* HEADER */}
        <div className="form-card-header">
          <span className="form-card-title">Interaction Details</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="status-badge" style={{ background: statusColor[formStatus] + '20', color: statusColor[formStatus], border: `1px solid ${statusColor[formStatus]}40` }}>
              {statusLabel[formStatus]}
            </span>
            {isAIFilled && <span className="ai-badge">✦ AI Filled</span>}
          </div>
        </div>

        {/* SECTION 1: BASIC INFO */}
        <div className="form-section">
          <div className="section-title">Basic Information</div>
          <div className="form-row two-col">
            <div className="field-group">
              <label className="field-label">HCP Name *</label>
              <input id="f_hcp" className="field-input" readOnly
                value={formData.hcp} placeholder="Filled by AI Assistant →"
                onChange={e => dispatch(setFormField({ field: 'hcp', value: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Interaction Type</label>
              <select id="f_type" className="field-select"
                value={formData.type}
                onChange={e => dispatch(setFormField({ field: 'type', value: e.target.value }))}>
                <option value="">Select type...</option>
                <option>Meeting</option><option>Call</option>
                <option>Visit</option><option>Conference</option><option>Email</option>
              </select>
            </div>
          </div>
          <div className="form-row two-col">
            <div className="field-group">
              <label className="field-label">Date</label>
              <input id="f_date" className="field-input" type="date"
                value={formData.date}
                onChange={e => dispatch(setFormField({ field: 'date', value: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Time</label>
              <input id="f_time" className="field-input" type="time"
                value={formData.time}
                onChange={e => dispatch(setFormField({ field: 'time', value: e.target.value }))} />
            </div>
          </div>
          <div className="form-row one-col">
            <div className="field-group">
              <label className="field-label">Location / Attendees</label>
              <input id="f_location" className="field-input" readOnly
                value={formData.location} placeholder="Filled by AI Assistant →"
                onChange={e => dispatch(setFormField({ field: 'location', value: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* SECTION 2: DISCUSSION */}
        <div className="form-section">
          <div className="section-title">Discussion Details</div>
          <div className="form-row one-col">
            <div className="field-group">
              <label className="field-label">Topics Discussed</label>
              <textarea id="f_topics" className="field-textarea" rows={3} readOnly
                value={formData.topics} placeholder="Filled by AI Assistant →"
                onChange={e => dispatch(setFormField({ field: 'topics', value: e.target.value }))} />
            </div>
          </div>
          <div className="form-row one-col">
            <div className="field-group">
              <label className="field-label">Products Mentioned</label>
              <input id="f_products" className="field-input" readOnly
                value={formData.products} placeholder="Filled by AI Assistant →"
                onChange={e => dispatch(setFormField({ field: 'products', value: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* SECTION 3: MATERIALS */}
        <div className="form-section">
          <div className="section-title">Materials & Samples</div>
          <div style={{ marginBottom: 10 }}>
            <div className="materials-header">
              <span className="field-label">Materials Shared</span>
              <button className="add-btn" onClick={() => {
                const m = prompt('Enter material name:');
                if (m) dispatch(addMaterial(m));
              }}>+ Add</button>
            </div>
            <div className="tags-container">
              {formData.materials.length === 0
                ? <span className="empty-label">No materials added</span>
                : formData.materials.map((m, i) => (
                  <span key={i} className="material-tag">
                    {m}
                    <button onClick={() => dispatch(removeMaterial(i))}>✕</button>
                  </span>
                ))}
            </div>
          </div>
          <div>
            <div className="materials-header">
              <span className="field-label">Samples Distributed</span>
              <button className="add-btn" onClick={() => {
                const s = prompt('Enter sample name:');
                if (s) dispatch(addSample(s));
              }}>+ Add</button>
            </div>
            <div className="tags-container">
              {formData.samples.length === 0
                ? <span className="empty-label">No samples added</span>
                : formData.samples.map((s, i) => (
                  <span key={i} className="sample-tag">
                    {s}
                    <button onClick={() => dispatch(removeSample(i))}>✕</button>
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: SENTIMENT & OUTCOMES */}
        <div className="form-section">
          <div className="section-title">Sentiment & Outcome</div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Observed HCP Sentiment</label>
            <div className="sentiment-group">
              {['positive', 'neutral', 'negative'].map(s => (
                <button key={s}
                  className={`sent-btn sent-${s} ${formData.sentiment === s ? 'active' : ''}`}
                  onClick={() => dispatch(setSentiment(s))}>
                  {s === 'positive' ? '😊' : s === 'neutral' ? '😐' : '😞'} {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row one-col">
            <div className="field-group">
              <label className="field-label">Outcomes / Agreements</label>
              <textarea id="f_outcomes" className="field-textarea" rows={2} readOnly
                value={formData.outcomes} placeholder="Filled by AI Assistant →"
                onChange={e => dispatch(setFormField({ field: 'outcomes', value: e.target.value }))} />
            </div>
          </div>
          <div className="form-row one-col">
            <div className="field-group">
              <label className="field-label">Follow-up Actions</label>
              <textarea id="f_followup" className="field-textarea" rows={2} readOnly
                value={formData.followup} placeholder="Filled by AI Assistant →"
                onChange={e => dispatch(setFormField({ field: 'followup', value: e.target.value }))} />
            </div>
          </div>
          {formData.summary && (
            <div className="ai-summary-box">
              <div className="ai-summary-title">✦ AI Summary</div>
              <p>{formData.summary}</p>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="form-actions">
          <button className="btn-submit" onClick={handleSubmit}>
            <span>✓</span> Log Interaction
          </button>
          <button className="btn-clear" onClick={() => dispatch(clearForm())}>
            Clear
          </button>
          <span className="form-hint">
            {formStatus === 'draft' ? 'Use AI Assistant to fill →' :
             formStatus === 'saved' ? `Saved as #${currentInteractionId}` :
             'Form ready to submit'}
          </span>
        </div>
      </div>
    </div>
  );
}
