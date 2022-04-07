import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  Dataset,
  Model as ModelInfo,
  findDataset, findModel, putModel,
  filterLabels,
} from '../../app/database';
import { RootState } from '../../app/store';
import { createTransferMobileNet, loadTransferMobileNet, Model } from '../../app/model';

export interface ModelState {
  model: Model | null;
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


// loadModel loads a model of the given project from the database.
async function loadModel(
  projectID: number,
): Promise<Model> {
  return await loadTransferMobileNet(projectID);
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

      const model = await createTransferMobileNet();

      // 01. train model and save it to the database.
      const [history, prediction] = await model.train(dataset);
      const indexedDBKey = await model.save(projectID);
      const labels = filterLabels(dataset.labels);
      const labelNames = labels.map(label => label.name);

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
    return await model.predict(image);
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
