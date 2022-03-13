import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { fetchDataset } from './datasetAPI';
import { Dataset } from '../../app/database';

export interface DatasetState {
  dataset: Dataset | null;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: DatasetState = {
  dataset: null,
  status: 'idle',
};

export const fetchDatasetAsync = createAsyncThunk(
  'dataset/fetch',
  async (id: number) => {
    const response = await fetchDataset(id);
    return response.data
  }
);

export const datasetSlice = createSlice({
  name: 'dataset',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDatasetAsync.pending, (state, action) => {
        state.status = 'loading';
      })
      .addCase(fetchDatasetAsync.fulfilled, (state, action) => {
        state.status = 'idle';
        state.dataset = action.payload;
      });
  },
});

export const selectDataset = (state: RootState) => state.dataset?.dataset;

export default datasetSlice.reducer;
