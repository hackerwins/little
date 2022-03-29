import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as tf from '@tensorflow/tfjs';

import {
  Dataset, TrainingLog, Prediction, LabelPrediction,
  Model as ModelInfo,
  findDataset, findModel, putModel,
  filterLabels,
} from '../../app/database';
import { RootState } from '../../app/store';
import { train, predict, saveModel, loadModel } from './modelAPI';

export interface ModelState {
  model: tf.LayersModel | null;
  modelInfo: ModelInfo | null;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: ModelState = {
  model: null,
  modelInfo: null,
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

      // 01. train model and save it to the database.
      const [model, info] = await train(dataset);
      const indexedDBKey = await saveModel(projectID, model, dataset);

      // 02. convert tf.info to history.
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
      const labelNames = filterLabels(dataset.labels).map(label => label.name);

      // 03. build prediction.
      const prediction: Prediction = {
        projectID: dataset.projectID!,
        labels: [],
      };
      for (const label of dataset.labels) {
        const labelPrediction: LabelPrediction = {
          label: label.name,
          images: [],
        };
        for (const image of label.images) {
          const result = await predict(image.src, model);
          labelPrediction.images.push({
            scores: result,
          });
        }
        prediction.labels.push(labelPrediction);
      }

      const modelInfo = {
        projectID: dataset.projectID!,
        labelNames,
        history,
        indexedDBKey,
        prediction,
      };
      await putModel(modelInfo);
      return { model, modelInfo };
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
    return { model, modelInfo };
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

        const { model, modelInfo } = action.payload;
        state.status = 'idle';
        if (state.model) {
          state.model.dispose();
        }
        state.model = model;
        state.modelInfo = modelInfo;
      })
      .addCase(trainModelAsync.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(loadModelAsync.fulfilled, (state, action) => {
        if (!action.payload) {
          return;
        }

        const { model, modelInfo } = action.payload;
        state.status = 'idle';
        state.model = model;
        state.modelInfo = modelInfo;
      });
  },
});

export const selectModelInfo = (state: RootState) => state.model?.modelInfo;
export const selectStatus = (state: RootState) => state.model?.status;

export default modelSlice.reducer;
