import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as tf from '@tensorflow/tfjs';

import { Dataset } from '../../app/database';
import { RootState } from '../../app/store';
import { fetchDataset } from '../dataset/datasetAPI';
import { train, saveModel } from './modelAPI';

export interface ModelState {
  model: tf.LayersModel | null;
  history: tf.History | null;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: ModelState = {
  model: null,
  history: null,
  status: 'idle',
};

// isTrainable returns true if the dataset is trainable.
function isTrainable(dataset: Dataset) {
  if (dataset.labels.length < 2) {
    return false;
  }

  for (const label of dataset.labels) {
    if (label.images.length < 5) {
      return false;
    }
  }

  return true;
}

export const trainModelAsync = createAsyncThunk(
  'model/train',
  async (datasetID: number) => {
    const response = await fetchDataset(datasetID);
    const dataset = response.data;

    if (!isTrainable(dataset)) {
      console.log('Dataset is not trainable');
      throw new Error('Dataset is not trainable');
    }

    const [model, history] = await train(dataset);
    await saveModel(model, history, dataset);
    return { model, history };
  }
);

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(trainModelAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(trainModelAsync.fulfilled, (state, action) => {
        const { model, history } = action.payload;
        state.status = 'idle';
        state.model = model;
        state.history = history;
      });
  },
});

export const selectHistory = (state: RootState) => state.model?.history;

export default modelSlice.reducer;
