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

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── SAFE ARRAYS ────────────────────────────────────────────────────────────
  const materials = Array.isArray(formData.materials) ? formData.materials : [];
  const samples   = Array.isArray(formData.samples)   ? formData.samples   : [];

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
        text: '✅ Interaction with **' + formData.hcp + '** successfully logged to database! ID: #' + result.id,
        toolUsed: 'log_interaction', timestamp: now(), fields: null,
      }));
    } catch (e) {
      dispatch(addMessage({
        id: Date.now(), role: 'ai',
        text: '⚠️ Could not save to database. Check backend is running.',
        toolUsed: null, timestamp: now(), fields: null,
      }));
    }
  };

  const statusColor = { draft: '#9ca3af', ai_filled: '#4f46e5', edited: '#f59e0b', saved: '#10b981' };
  const statusLabel = { draft: 'Draft', ai_filled: 'AI Filled', edited: 'Edited', saved: 'Saved ✓' };

  return (
    React.createElement('div', { className: 'form-panel' },
      React.createElement('div', { className: 'form-card' },

        // ── HEADER ────────────────────────────────────────────────────────
        React.createElement('div', { className: 'form-card-header' },
          React.createElement('span', { className: 'form-card-title' }, 'Interaction Details'),
          React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
            React.createElement('span', {
              className: 'status-badge',
              style: {
                background: (statusColor[formStatus] || '#9ca3af') + '20',
                color: statusColor[formStatus] || '#9ca3af',
                border: '1px solid ' + (statusColor[formStatus] || '#9ca3af') + '40',
              }
            }, statusLabel[formStatus] || 'Draft'),
            isAIFilled && React.createElement('span', { className: 'ai-badge' }, '✦ AI Filled')
          )
        ),

        // ── SECTION 1: BASIC INFO ─────────────────────────────────────────
        React.createElement('div', { className: 'form-section' },
          React.createElement('div', { className: 'section-title' }, 'Basic Information'),
          React.createElement('div', { className: 'form-row two-col' },
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'HCP Name *'),
              React.createElement('input', {
                id: 'f_hcp', className: 'field-input', readOnly: true,
                value: formData.hcp || '',
                placeholder: 'Filled by AI Assistant →',
                onChange: function(e) { dispatch(setFormField({ field: 'hcp', value: e.target.value })); }
              })
            ),
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'Interaction Type'),
              React.createElement('select', {
                id: 'f_type', className: 'field-select',
                value: formData.type || '',
                onChange: function(e) { dispatch(setFormField({ field: 'type', value: e.target.value })); }
              },
                React.createElement('option', { value: '' }, 'Select type...'),
                React.createElement('option', null, 'Meeting'),
                React.createElement('option', null, 'Call'),
                React.createElement('option', null, 'Visit'),
                React.createElement('option', null, 'Conference'),
                React.createElement('option', null, 'Email')
              )
            )
          ),
          React.createElement('div', { className: 'form-row two-col' },
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'Date'),
              React.createElement('input', {
                id: 'f_date', className: 'field-input', type: 'date',
                value: formData.date || '',
                onChange: function(e) { dispatch(setFormField({ field: 'date', value: e.target.value })); }
              })
            ),
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'Time'),
              React.createElement('input', {
                id: 'f_time', className: 'field-input', type: 'time',
                value: formData.time || '',
                onChange: function(e) { dispatch(setFormField({ field: 'time', value: e.target.value })); }
              })
            )
          ),
          React.createElement('div', { className: 'form-row one-col' },
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'Location / Attendees'),
              React.createElement('input', {
                id: 'f_location', className: 'field-input', readOnly: true,
                value: formData.location || '',
                placeholder: 'Filled by AI Assistant →',
                onChange: function(e) { dispatch(setFormField({ field: 'location', value: e.target.value })); }
              })
            )
          )
        ),

        // ── SECTION 2: DISCUSSION ─────────────────────────────────────────
        React.createElement('div', { className: 'form-section' },
          React.createElement('div', { className: 'section-title' }, 'Discussion Details'),
          React.createElement('div', { className: 'form-row one-col' },
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'Topics Discussed'),
              React.createElement('textarea', {
                id: 'f_topics', className: 'field-textarea', rows: 3, readOnly: true,
                value: formData.topics || '',
                placeholder: 'Filled by AI Assistant →',
                onChange: function(e) { dispatch(setFormField({ field: 'topics', value: e.target.value })); }
              })
            )
          ),
          React.createElement('div', { className: 'form-row one-col' },
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'Products Mentioned'),
              React.createElement('input', {
                id: 'f_products', className: 'field-input', readOnly: true,
                value: formData.products || '',
                placeholder: 'Filled by AI Assistant →',
                onChange: function(e) { dispatch(setFormField({ field: 'products', value: e.target.value })); }
              })
            )
          )
        ),

        // ── SECTION 3: MATERIALS ──────────────────────────────────────────
        React.createElement('div', { className: 'form-section' },
          React.createElement('div', { className: 'section-title' }, 'Materials & Samples'),
          React.createElement('div', { style: { marginBottom: 10 } },
            React.createElement('div', { className: 'materials-header' },
              React.createElement('span', { className: 'field-label' }, 'Materials Shared'),
              React.createElement('button', {
                className: 'add-btn',
                onClick: function() {
                  var m = prompt('Enter material name:');
                  if (m) dispatch(addMaterial(m));
                }
              }, '+ Add')
            ),
            React.createElement('div', { className: 'tags-container' },
              materials.length === 0
                ? React.createElement('span', { className: 'empty-label' }, 'No materials added')
                : materials.map(function(m, i) {
                    return React.createElement('span', { key: i, className: 'material-tag' },
                      m,
                      React.createElement('button', {
                        onClick: function() { dispatch(removeMaterial(i)); }
                      }, '✕')
                    );
                  })
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { className: 'materials-header' },
              React.createElement('span', { className: 'field-label' }, 'Samples Distributed'),
              React.createElement('button', {
                className: 'add-btn',
                onClick: function() {
                  var s = prompt('Enter sample name:');
                  if (s) dispatch(addSample(s));
                }
              }, '+ Add')
            ),
            React.createElement('div', { className: 'tags-container' },
              samples.length === 0
                ? React.createElement('span', { className: 'empty-label' }, 'No samples added')
                : samples.map(function(s, i) {
                    return React.createElement('span', { key: i, className: 'sample-tag' },
                      s,
                      React.createElement('button', {
                        onClick: function() { dispatch(removeSample(i)); }
                      }, '✕')
                    );
                  })
            )
          )
        ),

        // ── SECTION 4: SENTIMENT & OUTCOMES ──────────────────────────────
        React.createElement('div', { className: 'form-section' },
          React.createElement('div', { className: 'section-title' }, 'Sentiment & Outcome'),
          React.createElement('div', { className: 'field-group', style: { marginBottom: 12 } },
            React.createElement('label', { className: 'field-label' }, 'Observed HCP Sentiment'),
            React.createElement('div', { className: 'sentiment-group' },
              ['positive', 'neutral', 'negative'].map(function(s) {
                return React.createElement('button', {
                  key: s,
                  className: 'sent-btn sent-' + s + (formData.sentiment === s ? ' active' : ''),
                  onClick: function() { dispatch(setSentiment(s)); }
                },
                  s === 'positive' ? '😊' : s === 'neutral' ? '😐' : '😞',
                  ' ',
                  s.charAt(0).toUpperCase() + s.slice(1)
                );
              })
            )
          ),
          React.createElement('div', { className: 'form-row one-col' },
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'Outcomes / Agreements'),
              React.createElement('textarea', {
                id: 'f_outcomes', className: 'field-textarea', rows: 2, readOnly: true,
                value: formData.outcomes || '',
                placeholder: 'Filled by AI Assistant →',
                onChange: function(e) { dispatch(setFormField({ field: 'outcomes', value: e.target.value })); }
              })
            )
          ),
          React.createElement('div', { className: 'form-row one-col' },
            React.createElement('div', { className: 'field-group' },
              React.createElement('label', { className: 'field-label' }, 'Follow-up Actions'),
              React.createElement('textarea', {
                id: 'f_followup', className: 'field-textarea', rows: 2, readOnly: true,
                value: formData.followup || '',
                placeholder: 'Filled by AI Assistant →',
                onChange: function(e) { dispatch(setFormField({ field: 'followup', value: e.target.value })); }
              })
            )
          ),
          formData.summary && React.createElement('div', { className: 'ai-summary-box' },
            React.createElement('div', { className: 'ai-summary-title' }, '✦ AI Summary'),
            React.createElement('p', null, formData.summary)
          )
        ),

        // ── ACTIONS ───────────────────────────────────────────────────────
        React.createElement('div', { className: 'form-actions' },
          React.createElement('button', { className: 'btn-submit', onClick: handleSubmit },
            React.createElement('span', null, '✓'), ' Log Interaction'
          ),
          React.createElement('button', {
            className: 'btn-clear',
            onClick: function() { dispatch(clearForm()); }
          }, 'Clear'),
          React.createElement('span', { className: 'form-hint' },
            formStatus === 'draft' ? 'Use AI Assistant to fill →' :
            formStatus === 'saved' ? 'Saved as #' + currentInteractionId :
            'Form ready to submit'
          )
        )
      )
    )
  );
}
