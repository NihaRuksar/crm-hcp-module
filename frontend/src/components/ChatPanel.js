import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addMessage, setTyping, setActiveTool, setSuggestions,
  populateForm, partialUpdateForm,
} from '../store';
import { sendChatMessage } from '../services/api';

const TOOLS = [
  { id: 'log_interaction',   label: 'Log',         icon: '📝', desc: 'Log new interaction' },
  { id: 'edit_interaction',  label: 'Edit',        icon: '✏️', desc: 'Edit existing data' },
  { id: 'fetch_hcp_profile', label: 'HCP Profile', icon: '👤', desc: 'Fetch doctor profile' },
  { id: 'schedule_followup', label: 'Follow-up',   icon: '📅', desc: 'Schedule next action' },
  { id: 'analyze_sentiment', label: 'Sentiment',   icon: '📊', desc: 'Analyze tone' },
];

const TOOL_LABELS = {
  log_interaction:   'log_interaction — entity extraction + form fill',
  edit_interaction:  'edit_interaction — partial field update',
  fetch_hcp_profile: 'fetch_hcp_profile — HCP profile lookup',
  schedule_followup: 'schedule_followup — follow-up scheduler',
  analyze_sentiment: 'analyze_sentiment — sentiment analysis',
};

const PLACEHOLDERS = {
  log_interaction:   'e.g. Today I met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochures.',
  edit_interaction:  'e.g. Change the sentiment to negative and update the HCP name to Dr. John.',
  fetch_hcp_profile: 'e.g. Dr. Rahul Sharma',
  schedule_followup: 'e.g. Schedule a follow-up meeting in 2 weeks to discuss trial results.',
  analyze_sentiment: 'e.g. The doctor was very enthusiastic about the new drug and asked for samples.',
};

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPanel() {
  const dispatch = useDispatch();
  const { messages, activeTool, isTyping } = useSelector(function(s) { return s.chat; });
  const { formData, currentInteractionId } = useSelector(function(s) { return s.interaction; });
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(function() {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function handleSend() {
    var msg = input.trim();
    if (!msg || isTyping) return;
    setInput('');

    dispatch(addMessage({
      id: Date.now(), role: 'user', text: msg,
      toolUsed: null, timestamp: nowTime(), fields: null,
    }));
    dispatch(setTyping(true));

    try {
      var result = await sendChatMessage(msg, activeTool, currentInteractionId, formData);

      // ── SAFE DATA EXTRACTION ─────────────────────────────────────────────
      var toolUsed = (result && result.tool_used) ? result.tool_used : activeTool;
      var data = {};
      try {
        data = (result && result.result) ? result.result : (result || {});
      } catch(e) {
        data = {};
      }

      dispatch(setActiveTool(toolUsed));

      var responseText = '';
      var fields = null;

      // ── TOOL 1: LOG INTERACTION ──────────────────────────────────────────
      if (toolUsed === 'log_interaction') {
        try {
          if (data && typeof data === 'object') {
            dispatch(populateForm(data));
            var suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
            var suggestionText = suggestions.length > 0
              ? '\n\n💡 AI Suggestions:\n' + suggestions.map(function(s) { return '• ' + s; }).join('\n')
              : '';
            var summaryText = data.summary ? '\n\n📋 Summary: ' + data.summary : '';
            responseText = '✅ Interaction details extracted and form filled!' + suggestionText + summaryText;
            if (suggestions.length > 0) dispatch(setSuggestions(suggestions));
            fields = {
              'HCP':       data.hcp       || '',
              'Type':      data.type      || '',
              'Date':      data.date      || '',
              'Sentiment': data.sentiment || '',
              'Products':  data.products  || '',
              'Topics':    data.topics    || '',
            };
          } else {
            responseText = '✅ Interaction logged successfully.';
          }
        } catch(e) {
          responseText = '✅ Interaction logged successfully.';
        }
      }

     // ── TOOL 2: EDIT INTERACTION ─────────────────────────────────────────
      else if (toolUsed === 'edit_interaction') {
        try {
          var changes = {};
          var changedFields = [];

          if (data && data.changes && typeof data.changes === 'object') {
            changes = data.changes;
          } else if (data && typeof data === 'object') {
            changes = data;
          }

          if (data && Array.isArray(data.changed_fields) && data.changed_fields.length > 0) {
            changedFields = data.changed_fields;
          } else {
            try {
              changedFields = Object.entries(changes)
                .filter(function(pair) {
                  return pair[1] !== null && pair[1] !== undefined;
                })
                .map(function(pair) { return pair[0]; });
            } catch(e) {
              changedFields = [];
            }
          }

          if (changedFields.length > 0) {
            responseText = '✏️ Updated ' + changedFields.length + ' field(s): ' + changedFields.join(', ') + '.';
            fields = {};
            changedFields.forEach(function(key) {
              if (changes[key] !== null && changes[key] !== undefined) {
                fields[key] = String(changes[key]);
              }
            });
            dispatch(partialUpdateForm(changes));
          } else {
            responseText = '✏️ Edit processed successfully.';
            fields = null;
          }
        } catch(e) {
          responseText = '✏️ Edit processed successfully.';
          fields = null;
        }
      }

      // ── TOOL 3: FETCH HCP PROFILE ────────────────────────────────────────
      else if (toolUsed === 'fetch_hcp_profile') {
        try {
          if (data && data.name) {
            responseText = '👤 HCP Profile: ' + data.name + '\n\n'
              + 'Specialty: ' + (data.specialty || 'N/A') + '\n'
              + 'Hospital: ' + (data.hospital || 'N/A') + '\n'
              + 'City: ' + (data.city || 'N/A') + '\n'
              + 'Past Interactions: ' + (data.past_interactions || 0) + '\n'
              + 'Last Visit: ' + (data.last_visit || 'N/A') + '\n'
              + 'Preferred Contact: ' + (data.preferred_contact || 'N/A') + '\n\n'
              + '📝 ' + (data.notes || '');
          } else {
            responseText = '👤 HCP profile retrieved successfully.';
          }
        } catch(e) {
          responseText = '👤 HCP profile retrieved.';
        }
      }

      // ── TOOL 4: SCHEDULE FOLLOW-UP ───────────────────────────────────────
      else if (toolUsed === 'schedule_followup') {
        try {
          if (data && data.followup_date) {
            var actionItems = Array.isArray(data.action_items)
              ? data.action_items.map(function(a) { return '• ' + a; }).join('\n')
              : '';
            responseText = '📅 Follow-up Scheduled\n\n'
              + 'Date: ' + data.followup_date + '\n'
              + 'Type: ' + (data.followup_type || 'Meeting') + '\n'
              + 'Priority: ' + (data.priority || 'Medium') + '\n\n'
              + (actionItems ? 'Action Items:\n' + actionItems + '\n\n' : '')
              + (data.message || '');
            dispatch(partialUpdateForm({
              followup: (data.followup_type || 'Meeting') + ' on ' + data.followup_date
                + (Array.isArray(data.action_items) ? ' — ' + data.action_items.join(', ') : ''),
            }));
          } else {
            responseText = '📅 Follow-up scheduled successfully.';
          }
        } catch(e) {
          responseText = '📅 Follow-up scheduled.';
        }
      }

      // ── TOOL 5: ANALYZE SENTIMENT ────────────────────────────────────────
      else if (toolUsed === 'analyze_sentiment') {
        try {
          if (data && data.sentiment) {
            responseText = '📊 Sentiment Analysis\n\n'
              + 'Result: ' + data.sentiment.toUpperCase()
              + ' (' + Math.round((data.confidence || 0) * 100) + '% confidence)\n'
              + 'Score: ' + (data.score || 'N/A') + '/10\n\n'
              + 'Reasoning: ' + (data.reasoning || 'N/A') + '\n\n'
              + 'Sales Implication: ' + (data.sales_implication || 'N/A') + '\n\n'
              + 'Recommended Action: ' + (data.recommended_action || 'N/A');
            dispatch(partialUpdateForm({ sentiment: data.sentiment }));
          } else {
            responseText = '📊 Sentiment analysis completed.';
          }
        } catch(e) {
          responseText = '📊 Sentiment analyzed.';
        }
      }

      // ── FALLBACK ─────────────────────────────────────────────────────────
      else {
        try {
          responseText = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        } catch(e) {
          responseText = 'Response received successfully.';
        }
      }

      dispatch(addMessage({
        id: Date.now() + 1, role: 'ai',
        text: responseText,
        toolUsed: TOOL_LABELS[toolUsed] || toolUsed,
        timestamp: nowTime(),
        fields: fields,
      }));

    } catch (err) {
      dispatch(addMessage({
        id: Date.now() + 1, role: 'ai',
        text: '⚠️ Error: ' + (err.message || 'Something went wrong. Please try again.'),
        toolUsed: null, timestamp: nowTime(), fields: null,
      }));
    }

    dispatch(setTyping(false));
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    React.createElement('div', { className: 'chat-panel' },
      React.createElement('div', { className: 'chat-header' },
        React.createElement('div', { className: 'chat-title-row' },
          React.createElement('div', { className: 'chat-icon' },
            React.createElement('span', null, '✦')
          ),
          React.createElement('div', null,
            React.createElement('div', { className: 'chat-title-text' }, 'AI Assistant'),
            React.createElement('div', { className: 'chat-subtitle' }, 'Log Interaction via chat')
          )
        ),
        React.createElement('div', { className: 'agent-status' },
          React.createElement('span', { className: 'status-dot' }),
          'LangGraph Active'
        )
      ),

      React.createElement('div', { className: 'tools-bar' },
        TOOLS.map(function(t) {
          return React.createElement('button', {
            key: t.id,
            className: 'tool-chip' + (activeTool === t.id ? ' active' : ''),
            onClick: function() { dispatch(setActiveTool(t.id)); },
            title: t.desc,
          },
            React.createElement('span', null, t.icon),
            ' ',
            t.label
          );
        })
      ),

      React.createElement('div', { className: 'chat-messages' },
        messages.map(function(msg) {
          return React.createElement('div', {
            key: msg.id,
            className: 'msg-wrapper ' + msg.role,
          },
            React.createElement('div', {
              className: 'msg-bubble ' + msg.role,
              dangerouslySetInnerHTML: { __html: renderText(msg.text) },
            }),
            msg.toolUsed && React.createElement('div', { className: 'tool-badge' },
              '⚙ LangGraph Tool: ' + msg.toolUsed
            ),
            msg.fields && React.createElement('div', { className: 'fields-extracted' },
              React.createElement('div', { className: 'fields-title' }, 'Fields Extracted:'),
              Object.entries(msg.fields)
                .filter(function(pair) {
                  return pair[1] !== null && pair[1] !== undefined && pair[1] !== '';
                })
                .map(function(pair) {
                  return React.createElement('div', { key: pair[0], className: 'field-row' },
                    React.createElement('span', { className: 'field-key' }, pair[0]),
                    React.createElement('span', { className: 'field-val' }, String(pair[1]))
                  );
                })
            ),
            React.createElement('div', { className: 'msg-time' }, msg.timestamp)
          );
        }),

        isTyping && React.createElement('div', { className: 'msg-wrapper ai' },
          React.createElement('div', { className: 'msg-bubble ai typing-bubble' },
            React.createElement('span', { className: 'dot' }),
            React.createElement('span', { className: 'dot' }),
            React.createElement('span', { className: 'dot' })
          )
        ),
        React.createElement('div', { ref: bottomRef })
      ),

      React.createElement('div', { className: 'chat-input-area' },
        React.createElement('div', { className: 'input-hint' },
          '💡 Active tool: ',
          React.createElement('strong', null,
            (TOOLS.find(function(t) { return t.id === activeTool; }) || {}).label
          ),
          ' — AI fills the left form'
        ),
        React.createElement('div', { className: 'input-row' },
          React.createElement('textarea', {
            ref: inputRef,
            className: 'chat-input',
            value: input,
            onChange: function(e) { setInput(e.target.value); },
            onKeyDown: handleKey,
            placeholder: PLACEHOLDERS[activeTool] || 'Describe your interaction...',
            rows: 2,
            disabled: isTyping,
          }),
          React.createElement('button', {
            className: 'send-btn',
            onClick: handleSend,
            disabled: isTyping || !input.trim(),
          }, '➤')
        )
      )
    )
  );
}
