import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as tf from '@tensorflow/tfjs';

import { Dataset, TrainingLog, findDataset, findModel, putModel } from '../../app/database';
import { RootState } from '../../app/store';
import { train, predict, saveModel, loadModel } from './modelAPI';

export interface ModelState {
  model: tf.LayersModel | null;
  history: Array<TrainingLog> | null;
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
    try {
      const response = await findDataset(projectID);
      const dataset = response.data;
      if (!isTrainable(dataset)) {
        throw new Error('Dataset is not trainable');
      }

      // TODO(hackerwins): off load below to a web worker.
      const [model, info] = await train(dataset);
      const indexedDBKey = await saveModel(projectID, model, dataset);

      // convert training info to history.
      const history: Array<TrainingLog> = [];
      let idx = 0;
      for (const a of info.history.acc) {
        history.push({
          epoch: idx,
          accuracy: a as number,
          loss: info.history.loss[idx] as number,
        });
        idx += 1;
      }
      const labelNames = dataset.labels.filter(
        (label) => !!label.name
      ).map(label => label.name);

      await putModel({
        projectID: dataset.projectID!,
        labelNames,
        history,
        indexedDBKey,
      });

      return { model, history };
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
);

// loadModelAsync loads a model from the database.
export const loadModelAsync = createAsyncThunk(
  'model/load',
  async (projectID: number) => {
    const response = await findModel(projectID);
    const modelInfo = response.data;
    const model = await loadModel(projectID);
    return { model, history: modelInfo.history! };
  },
);

// predictAsync predicts a single image.
export const predictAsync = createAsyncThunk(
  'model/predict',
  async (image: string, {getState}) => {
    const state = getState() as RootState ;
    const model = state.model.model!;
    return await predict(image, model);
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
        if (state.model) {
          state.model.dispose();
        }
        state.model = model;
        state.history = history;
      })
      .addCase(trainModelAsync.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(loadModelAsync.fulfilled, (state, action) => {
        if (!action.payload) {
          return;
        }

        const { model, history } = action.payload;
        state.status = 'idle';
        state.model = model;
        state.history = history;
      });
  },
});

export const selectHistory = (state: RootState) => state.model?.history;
export const selectStatus = (state: RootState) => state.model?.status;

export default modelSlice.reducer;
