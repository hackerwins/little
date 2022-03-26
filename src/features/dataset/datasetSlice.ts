import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { RootState } from '../../app/store';
import { Dataset, findDataset, addImageToDataset } from '../../app/database';

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
  async (datasetID: number) => {
    const response = await findDataset(datasetID);
    return response.data;
  }
);

export const addImageToDatasetAsync = createAsyncThunk(
  'dataset/addImage',
  async ({datasetID, label, image}: {datasetID: number, label: string, image: string}) => {
    await addImageToDataset(datasetID, label, image);
    const response = await findDataset(datasetID);
    return response.data;
  }
);

export const datasetSlice = createSlice({
  name: 'dataset',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDatasetAsync.pending, (state, action) => {
        state.status = 'loading';
      })
      .addCase(fetchDatasetAsync.fulfilled, (state, action) => {
        state.status = 'idle';
        state.dataset = action.payload;
      })
      .addCase(addImageToDatasetAsync.pending, (state, action) => {
        state.status = 'loading';
      })
      .addCase(addImageToDatasetAsync.fulfilled, (state, action) => {
        state.status = 'idle';
        state.dataset = action.payload;
      });
  },
});

export const selectDataset = (state: RootState) => state.dataset?.dataset;

export default datasetSlice.reducer;
