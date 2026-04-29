import { configureStore, createSlice } from '@reduxjs/toolkit';

// ── INTERACTION SLICE ─────────────────────────────────────────────────────────
const interactionSlice = createSlice({
  name: 'interaction',
  initialState: {
    formData: {
      hcp: '',
      type: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      location: '',
      topics: '',
      products: '',
      sentiment: '',
      outcomes: '',
      followup: '',
      materials: [],
      samples: [],
      summary: '',
    },
    savedInteractions: [],
    currentInteractionId: null,
    isAIFilled: false,
    formStatus: 'draft', // draft | ai_filled | edited | saved
  },
  reducers: {
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    populateForm: (state, action) => {
      const data = action.payload;
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          if (key in state.formData) {
            state.formData[key] = data[key];
          }
        }
      });
      state.isAIFilled = true;
      state.formStatus = 'ai_filled';
    },
    partialUpdateForm: (state, action) => {
      // For edit_interaction — only update non-null fields
      const data = action.payload;
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && key in state.formData) {
          state.formData[key] = data[key];
        }
      });
      state.formStatus = 'edited';
    },
    addMaterial: (state, action) => {
      if (!state.formData.materials.includes(action.payload)) {
        state.formData.materials.push(action.payload);
      }
    },
    removeMaterial: (state, action) => {
      state.formData.materials.splice(action.payload, 1);
    },
    addSample: (state, action) => {
      if (!state.formData.samples.includes(action.payload)) {
        state.formData.samples.push(action.payload);
      }
    },
    removeSample: (state, action) => {
      state.formData.samples.splice(action.payload, 1);
    },
    setSentiment: (state, action) => {
      state.formData.sentiment = action.payload;
    },
    saveInteraction: (state, action) => {
      state.savedInteractions.push({ ...state.formData, id: action.payload });
      state.currentInteractionId = action.payload;
      state.formStatus = 'saved';
    },
    clearForm: (state) => {
      state.formData = {
        hcp: '', type: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        location: '', topics: '', products: '', sentiment: '',
        outcomes: '', followup: '', materials: [], samples: [], summary: '',
      };
      state.isAIFilled = false;
      state.formStatus = 'draft';
      state.currentInteractionId = null;
    },
  },
});

// ── CHAT SLICE ────────────────────────────────────────────────────────────────
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [
      {
        id: 1,
        role: 'ai',
        text: "👋 Hi! I'm your AI assistant powered by **LangGraph + Groq (gemma2-9b-it)**.\n\nDescribe your HCP interaction naturally and I'll fill the form automatically.\n\nTry: *\"Today I met Dr. Smith, discussed Product X efficacy, sentiment was positive, shared brochures.\"*",
        toolUsed: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fields: null,
      }
    ],
    activeTool: 'log_interaction',
    isTyping: false,
    suggestions: [],
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setActiveTool: (state, action) => {
      state.activeTool = action.payload;
    },
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
    },
    clearMessages: (state) => {
      state.messages = state.messages.slice(0, 1);
    },
  },
});

export const {
  setFormField, populateForm, partialUpdateForm,
  addMaterial, removeMaterial, addSample, removeSample,
  setSentiment, saveInteraction, clearForm,
} = interactionSlice.actions;

export const {
  addMessage, setTyping, setActiveTool, setSuggestions, clearMessages,
} = chatSlice.actions;

export const store = configureStore({
  reducer: {
    interaction: interactionSlice.reducer,
    chat: chatSlice.reducer,
  },
});
