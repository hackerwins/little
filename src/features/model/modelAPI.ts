import * as tf from '@tensorflow/tfjs';

import {
  Dataset,
  TrainingLog,
  Prediction,
  ImagePrediction,
} from '../../app/database';

import { predictAsync, trainAsync } from '../../app/model/finetuned-mobilenet';

// predict predicts the class of a given image.
export async function predict(
  encodedImage: string,
  model: tf.LayersModel,
): Promise<ImagePrediction> {
  return await predictAsync(encodedImage, model);
}

// train creates a model and trains it on the given dataset.
export async function train(
  dataset: Dataset
): Promise<[tf.LayersModel, Array<TrainingLog>, Prediction]> {
  return await trainAsync(dataset);
}

// saveModel saves a given model to the database.
export async function saveModel(
  projectID: number,
  model: tf.LayersModel,
  dataset: Dataset,
): Promise<string> {
  const indexedDBKey = `indexeddb://maltiese-models-${projectID}`;
  await model.save(indexedDBKey);
  return indexedDBKey;
}

// loadModel loads a model of the given project from the database.
export async function loadModel(
  projectID: number,
): Promise<tf.LayersModel> {
  const indexedDBKey = `indexeddb://maltiese-models-${projectID}`;
  return await tf.loadLayersModel(indexedDBKey);
}

