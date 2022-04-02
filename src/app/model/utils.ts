import * as tf from '@tensorflow/tfjs';

import {
  Dataset,
  TrainingLog,
  Prediction,
  ImagePrediction,
  filterLabels,
} from '../database';

// createImage creates a HTMLImageElement from a given base64 string.
export function createImage(encodedImage: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = encodedImage;
  });
}

// toTensor converts a given image to a tensor.
// function toTensor(imageElement: HTMLImageElement): tf.Tensor {
//   return tf.tidy(() => {
//     const image = tf.browser.fromPixels(imageElement);
// 
//     const resized = tf.image.resizeBilinear(image, [imageSize, imageSize], true);
// 
//     // Normalize the image from [0, 255] to [inputMin, inputMax].
//     return tf.add(tf.mul(tf.cast(resized, 'float32'), normalizationConstant), inputMin);
//   });
// }

// toTensor converts a given image to a tensor.
export function toTensor(
  imageElement: HTMLImageElement,
  imageSize: number,
  numChannels: number,
): tf.Tensor {
  const inputMin = -1;
  const inputMax = 1;

  // Values read from images are in the range [0.0, 255.0], but they must
  // be normalized to [min, max] before passing to the mobilenet classifier.
  // Different implementations of mobilenet have different values of [min, max].
  // We store the appropriate normalization parameters using these two scalars
  // such that:
  // out = (in / 255.0) * (inputMax - inputMin) + inputMin;
  const normalizationConstant = (inputMax - inputMin) / 255.0;

  const canvas = document.createElement('canvas');
  canvas.width = imageSize;
  canvas.height = imageSize;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageElement, 0, 0, imageSize, imageSize);
  const imageData = ctx.getImageData(0, 0, imageSize, imageSize).data;
  const values = new Int32Array(imageSize * imageSize * numChannels);
  for (let i = 0; i < imageSize * imageSize; i++) {
    for (let channel = 0; channel < numChannels; ++channel) {
      values[i * numChannels + channel] = imageData[i * 4 + channel];
    }
  }

  return tf.tidy(() => {
    const resized = tf.tensor3d(values, [imageSize, imageSize, numChannels]);
    return tf.add(tf.mul(tf.cast(resized, 'float32'), normalizationConstant), inputMin);
  });
}

// toHistory converts a given tf.History to an array of TrainingLog.
export function toHistory(
  info: tf.History,
): Array<TrainingLog> {
  const history: Array<TrainingLog> = [];
  let idx = 0;
  for (const acc of info.history.acc) {
    history.push({
      epoch: idx,
      accuracy: acc as number,
      loss: info.history.loss[idx] as number,
    });
    idx += 1;
  }
  return history;
}

// toPrediction converts a given dataset to a prediction.
export function toPrediction(
  dataset: Dataset,
  preds: Array<ImagePrediction>,
): Prediction {
  const labels = filterLabels(dataset.labels);

  // create prediction.
  const prediction: Prediction = {
    projectID: dataset.projectID!,
    labels: [],
  };

  for (const label of labels) {
    prediction.labels.push({
      label: label.name,
      images: preds.splice(0, label.images.length),
    });
  }

  return prediction;
}

