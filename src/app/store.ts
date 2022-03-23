import { configureStore, getDefaultMiddleware, ThunkAction, Action } from '@reduxjs/toolkit';
import datasetReducer from '../features/dataset/datasetSlice';
import modelReducer from '../features/model/modelSlice';

export const store = configureStore({
  reducer: {
    dataset: datasetReducer,
    model: modelReducer,
  },
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['model/train/fulfilled'],
      ignoredPaths: ['model.model', 'model.history'],
    },
    immutableCheck: {
      ignoredPaths: ['model.model', 'model.history'],
    },
  }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
