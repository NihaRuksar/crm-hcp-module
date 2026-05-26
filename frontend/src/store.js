import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialFormData = {
  hcp: '',
  type: '',
  date: '',
  time: '',
  location: '',
  topics: '',
  products: '',
  materials: [],
  samples: [],
  sentiment: 'neutral',
  outcomes: '',
  followup: '',
  summary: '',
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState: {
    formData: initialFormData,
    isAIFilled: false,
    formStatus: 'draft',
    currentInteractionId: null,
  },
  reducers: {
    setFormField: (state, action) => {
      state.formData[action.payload.field] = action.payload.value;
      state.formStatus = 'edited';
    },
    setSentiment: (state, action) => {
      state.formData.sentiment = action.payload;
      state.formStatus = 'edited';
    },
    addMaterial: (state, action) => {
      state.formData.materials.push(action.payload);
    },
    removeMaterial: (state, action) => {
      state.formData.materials.splice(action.payload, 1);
    },
    addSample: (state, action) => {
      state.formData.samples.push(action.payload);
    },
    removeSample: (state, action) => {
      state.formData.samples.splice(action.payload, 1);
    },
    clearForm: (state) => {
      state.formData = initialFormData;
      state.isAIFilled = false;
      state.formStatus = 'draft';
      state.currentInteractionId = null;
    },
    saveInteraction: (state, action) => {
      state.currentInteractionId = action.payload;
      state.formStatus = 'saved';
    },
    populateForm: (state, action) => {
      state.formData = {
        ...state.formData,
        ...action.payload,
      };
      state.isAIFilled = true;
      state.formStatus = 'ai_filled';
    },
    partialUpdateForm: (state, action) => {
      state.formData = {
        ...state.formData,
        ...action.payload,
      };
      state.formStatus = 'edited';
    },
  },
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
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
  },
});

export const {
  setFormField,
  setSentiment,
  addMaterial,
  removeMaterial,
  addSample,
  removeSample,
  clearForm,
  saveInteraction,
  populateForm,
  partialUpdateForm,
} = interactionSlice.actions;

export const {
  addMessage,
  setTyping,
  setActiveTool,
  setSuggestions,
} = chatSlice.actions;

export const store = configureStore({
  reducer: {
    interaction: interactionSlice.reducer,
    chat: chatSlice.reducer,
  },
});
