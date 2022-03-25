import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as tf from '@tensorflow/tfjs';

import { Dataset, fetchDataset } from '../../app/database';
import { RootState } from '../../app/store';
import { train, predict, saveModel } from './modelAPI';

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
  const preparedLabels = dataset.labels.filter(label => label.name !== 'Unlabeled');
  if (preparedLabels.length < 2) {
    return false;
  }

  for (const label of preparedLabels) {
    if (label.images.length < 5) {
      return false;
    }
  }

  return true;
}

// trainModelAsync creates a new model and trains it.
export const trainModelAsync = createAsyncThunk(
  'model/train',
  async (projectID: number) => {
    const response = await fetchDataset(projectID);
    const dataset = response.data;

    if (!isTrainable(dataset)) {
      throw new Error('Dataset is not trainable');
    }

    const [model, history] = await train(dataset);
    await saveModel(projectID, model, history, dataset);
    return { model, history };
  },
);

export const predictAsync = createAsyncThunk(
  'model/predict',
  async (image: string, {getState}) => {
    const state = getState() as RootState ;
    const model = state.model.model!;
    const probabilities = await predict(image, model);
    console.log(probabilities);
  },
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
        if (!action.payload) {
          return;
        }

        const { model, history } = action.payload;
        state.status = 'idle';
        state.model = model;
        state.history = history;
      })
      .addCase(trainModelAsync.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const selectHistory = (state: RootState) => state.model?.history;
export const selectStatus = (state: RootState) => state.model?.status;

export default modelSlice.reducer;
