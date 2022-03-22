import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { fetchDataset } from '../dataset/datasetAPI';
import { train } from './modelAPI';

export interface ModelState {
  status: 'idle' | 'loading' | 'failed';
}

const initialState: ModelState = {
  status: 'idle',
};

export const trainModelAsync = createAsyncThunk(
  'model/train',
  async (datasetID: number): Promise<void> => {
    const response = await fetchDataset(datasetID);
    const dataset = response.data;
    const history = await train(dataset);
    console.log(history);
  }
);

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(trainModelAsync.pending, (state, action) => {
        state.status = 'loading';
      })
      .addCase(trainModelAsync.fulfilled, (state, action) => {
        state.status = 'idle';
      });
  },
});

export default modelSlice.reducer;
