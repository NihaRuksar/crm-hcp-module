import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialState = {
  interaction: {
    formData: {
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
    },
    messages: [],
    isAIFilled: false,
    formStatus: 'draft',
    currentInteractionId: null,
  },
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState: initialState.interaction,
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
      state.formData = initialState.interaction.formData;
      state.formStatus = 'draft';
      state.isAIFilled = false;
      state.currentInteractionId = null;
    },
    saveInteraction: (state, action) => {
      state.currentInteractionId = action.payload;
      state.formStatus = 'saved';
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
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
  addMessage,
} = interactionSlice.actions;

export const store = configureStore({
  reducer: {
    interaction: interactionSlice.reducer,
  },
});
