import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addMessage, setTyping, setActiveTool, setSuggestions,
  populateForm, partialUpdateForm,
} from '../store';
import { sendChatMessage } from '../services/api';

const TOOLS = [
  { id: 'log_interaction',   label: 'Log',        icon: '📝', desc: 'Log new interaction' },
  { id: 'edit_interaction',  label: 'Edit',       icon: '✏️', desc: 'Edit existing data' },
  { id: 'fetch_hcp_profile', label: 'HCP Profile',icon: '👤', desc: 'Fetch doctor profile' },
  { id: 'schedule_followup', label: 'Follow-up',  icon: '📅', desc: 'Schedule next action' },
  { id: 'analyze_sentiment', label: 'Sentiment',  icon: '📊', desc: 'Analyze tone' },
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
  var bold = new RegExp('\\*\\*(.+?)\\*\\*', 'g');
  var italic = new RegExp('\\*(.+?)\\*', 'g');
  return text.replace(bold, '<strong>$1</strong>').replace(italic, '<em>$1</em>').replace(/\n/g, '<br/>');
}

export default function ChatPanel() {
  const dispatch = useDispatch();
  const { messages, activeTool, isTyping } = useSelector(function(s) { return s.chat; });
  const { formData, currentInteractionId }  = useSelector(function(s) { return s.interaction; });
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

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
      var toolUsed = result.tool_used || activeTool;
      var data = result.result || result;

      dispatch(setActiveTool(toolUsed));

      var responseText = '';
      var fields = null;

      if (toolUsed === 'log_interaction' && data) {
        dispatch(populateForm(data));

        var suggestions = data.suggestions || [];
        var suggestionText = suggestions.length > 0
          ? '\n\n\uD83D\uDCA1 AI Suggestions:\n' + suggestions.map(function(s) { return '• ' + s; }).join('\n')
          : '';
        var summaryText = data.summary ? '\n\n\uD83D\uDCCB Summary: ' + data.summary : '';

        responseText = '\u2705 Interaction details extracted and form filled!' + suggestionText + summaryText;

        if (suggestions.length > 0) dispatch(setSuggestions(suggestions));

        fields = {
          'HCP':       data.hcp       || '',
          'Type':      data.type      || '',
          'Date':      data.date      || '',
          'Sentiment': data.sentiment || '',
          'Products':  data.products  || '',
          'Topics':    data.topics    || '',
        };
      }
      else if (toolUsed === 'edit_interaction' && data && data.changes) {
        var changed = Object.entries(data.changes).filter(function(pair) {
          return pair[1] !== null && pair[1] !== undefined;
        });
        responseText = '\u270F\uFE0F Updated ' + changed.length + ' field(s): ' + changed.map(function(pair) { return pair[0]; }).join(', ') + '.';
        fields = Object.fromEntries(changed);
        dispatch(partialUpdateForm(data.changes));
      }
      else if (toolUsed === 'fetch_hcp_profile' && data) {
        responseText = '\uD83D\uDC64 HCP Profile: ' + data.name + '\n\n'
          + 'Specialty: ' + data.specialty + '\nHospital: ' + data.hospital + '\nCity: ' + data.city + '\n'
          + 'Past Interactions: ' + data.past_interactions + '\nLast Visit: ' + data.last_visit + '\n'
          + 'Preferred Contact: ' + data.preferred_contact + '\n\n\uD83D\uDCDD ' + data.notes;
      }
      else if (toolUsed === 'schedule_followup' && data) {
        var actionItems = (data.action_items || []).map(function(a) { return '• ' + a; }).join('\n');
        responseText = '\uD83D\uDCC5 Follow-up Scheduled\n\n'
          + 'Date: ' + data.followup_date + '\nType: ' + data.followup_type + '\nPriority: ' + data.priority + '\n\n'
          + 'Action Items:\n' + actionItems + '\n\n' + data.message;

        if (data.followup_date) {
          dispatch(partialUpdateForm({
            followup: data.followup_type + ' on ' + data.followup_date + ' — ' + (data.action_items || []).join(', '),
          }));
        }
      }
      else if (toolUsed === 'analyze_sentiment' && data) {
        responseText = '\uD83D\uDCCA Sentiment Analysis\n\n'
          + 'Result: ' + (data.sentiment || '').toUpperCase() + ' (' + Math.round((data.confidence || 0) * 100) + '% confidence)\n'
          + 'Score: ' + data.score + '/10\n\n'
          + 'Reasoning: ' + data.reasoning + '\n\n'
          + 'Sales Implication: ' + data.sales_implication + '\n\n'
          + 'Recommended Action: ' + data.recommended_action;

        if (data.sentiment) dispatch(partialUpdateForm({ sentiment: data.sentiment }));
      }
      else {
        responseText = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
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
        text: '\u26A0\uFE0F Could not reach the backend. Make sure FastAPI is running at http://127.0.0.1:8000\n\nError: ' + err.message,
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
          React.createElement('div', { className: 'chat-icon' }, React.createElement('span', null, '\u2726')),
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
          }, React.createElement('span', null, t.icon), ' ', t.label);
        })
      ),

      React.createElement('div', { className: 'chat-messages' },
        messages.map(function(msg) {
          return React.createElement('div', { key: msg.id, className: 'msg-wrapper ' + msg.role },
            React.createElement('div', {
              className: 'msg-bubble ' + msg.role,
              dangerouslySetInnerHTML: { __html: renderText(msg.text) },
            }),
            msg.toolUsed && React.createElement('div', { className: 'tool-badge' }, '\u2699 LangGraph Tool: ' + msg.toolUsed),
            msg.fields && React.createElement('div', { className: 'fields-extracted' },
              React.createElement('div', { className: 'fields-title' }, 'Fields Extracted:'),
              Object.entries(msg.fields)
                .filter(function(pair) { return pair[1] !== null && pair[1] !== undefined && pair[1] !== ''; })
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
          '\uD83D\uDCA1 Active tool: ',
          React.createElement('strong', null, (TOOLS.find(function(t) { return t.id === activeTool; }) || {}).label),
          ' \u2014 AI fills the left form'
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
          }, '\u27A4')
        )
      )
    )
  );
}