import {
  Dataset,
  TrainingLog,
  Prediction,
  ImagePrediction,
  filterLabels,
} from '../database';

export interface Model {
  train(dataset: Dataset): Promise<[Array<TrainingLog>, Prediction]>;
  predict(image: string): Promise<ImagePrediction>;
  save(projectID: number): Promise<string>;
  dispose(): void;
}
