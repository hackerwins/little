import * as tf from '@tensorflow/tfjs';
import {categoricalCrossentropy} from '@tensorflow/tfjs-layers/dist/exports_metrics';

import { Dataset, filterLabels } from '../../app/database';

// createImage creates a HTMLImageElement from a given base64 string.
function createImage(encodedImage: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = encodedImage;
  });
}

// toTensor converts a given image to a tensor.
function toTensor(imageElement: HTMLImageElement): tf.Tensor {
  return tf.tidy(() => {
    const image = tf.browser.fromPixels(imageElement);
    const resized = tf.image.resizeNearestNeighbor(image, [224, 224]);

    // Normalize the image between -1 and 1. The image comes in between 0-255,
    // so we divide by 127 and subtract 1.
    return resized.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
  });
}

// predict predicts the class of a given image.
export async function predict(
  encodedImage: string,
  model: tf.LayersModel,
): Promise<Array<number>> {
  const img = await createImage(encodedImage);
  return tf.tidy(() => {
    const tensor = toTensor(img);
    const x = tensor.expandDims();
    const yhat = model.predictOnBatch(x) as tf.Tensor<tf.Rank>;
    const results = yhat.arraySync() as Array<Array<number>>;
    return results[0];
  });
}

// train creates a model and trains it on the given dataset.
// https://github.com/eisbilen/TFJS-CustomImageClassification
export async function train(dataset: Dataset): Promise<[tf.LayersModel, tf.History]> {
  const labels = filterLabels(dataset.labels);
  const baseModel = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
  );

  // modifies the pre-trained mobilenet to classify the given dataset.
  // freezes layers to train only the last couple of layers.
  const pooling = baseModel.getLayer('global_average_pooling2d_1');
  const predictions = tf.layers.dense({
    units: labels.length,
    activation: 'softmax',
    name: 'denseModified',
  }).apply(pooling.output) as tf.SymbolicTensor | tf.SymbolicTensor[];

  const model = tf.model({
    inputs: baseModel.input,
    outputs: predictions,
    name: 'modelModified',
  });
  
  // freeze mobilenet layers to make them untrainable
  // just keeps final layers trainable with argument trainablelayers
  const trainableLayers = ['denseModified','conv_pw_13_bn','conv_pw_13','conv_dw_13_bn','conv_dw_13'];
  for (const layer of model.layers) {
    layer.trainable = false;
    for (const trainableLayer of trainableLayers) {
      if (layer.name.indexOf(trainableLayer) === 0) {
        layer.trainable = true;
        break;
      }
    }
  }
  
  model.compile({
    loss: categoricalCrossentropy,
    optimizer: tf.train.adam(1e-3),
    metrics: ['accuracy', 'crossentropy'],
  });

  const tensors: Array<tf.Tensor> = [];
  const targets: Array<number> = [];
  for (let i = 0; i < labels.length; i++) {
    for (const image of labels[i].images) {
      const img = await createImage(image);
      const tensor = toTensor(img);
      tensors.push(tensor);
      targets.push(i);
    }
  }
  const xs = tf.stack(tensors);
  const xy = tf.oneHot(targets, labels.length);
  for (const tensor of tensors) {
    tensor.dispose();
  }

  const info = await model.fit(xs, xy, {
    epochs: 15,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch: number, logs?: tf.Logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs?.loss} accuracy = ${logs?.acc}`);
      },
    },
  });

  xs.dispose();
  xy.dispose();
  console.log('after train:', tf.memory());

  return [model, info];
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

