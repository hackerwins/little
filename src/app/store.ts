import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import datasetReducer from '../features/dataset/datasetSlice';

export const store = configureStore({
  reducer: {
    dataset: datasetReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
