import * as tf from '@tensorflow/tfjs';

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
async function toTensor(encodedImage: string): Promise<tf.Tensor> {
  const imageElement = await createImage(encodedImage);
  const image = tf.browser.fromPixels(imageElement);
  const resized = tf.image.resizeNearestNeighbor(image, [224, 224]);
  return resized.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
}

// predict predicts the class of a given image.
export async function predict(
  encodedImage: string,
  model: tf.LayersModel,
): Promise<Array<number>> {
  const tensor = await toTensor(encodedImage);
  const x = tf.stack([tensor]);
  const outputTensor = model.predictOnBatch(x) as tf.Tensor<tf.Rank>;
  const results = outputTensor.arraySync() as Array<Array<number>>;
  x.dispose();
  return results[0];
}

// train creates a model and trains it on the given dataset.
export async function train(dataset: Dataset): Promise<[tf.LayersModel, tf.History]> {
  const baseModel = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
  );
  const labels = filterLabels(dataset.labels);

  const pooling = baseModel.getLayer('global_average_pooling2d_1');
  const predictions = tf.layers.dense({
    units: labels.length,
    activation: 'softmax',
    name: 'dense',
  }).apply(pooling.output) as tf.SymbolicTensor | tf.SymbolicTensor[];

  const model = tf.model({
    inputs: baseModel.input,
    outputs: predictions,
    name: 'model',
  });
  
  const trainableLayers = ['dense', 'conv_pw_13_bn', 'conv_pw_13', 'conv_dw_13_bn', 'conv_dw_13'];
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
    loss: 'categoricalCrossentropy',
    optimizer: 'adam',
    metrics: ['accuracy', 'crossentropy'],
  });

  const tensors: Array<tf.Tensor> = [];
  const targets: Array<number> = [];
  for (let i = 0; i < labels.length; i++) {
    for (const image of labels[i].images) {
      const tensor = await toTensor(image);
      tensors.push(tensor);
      targets.push(i);
    }
  }
  const xs = tf.stack(tensors);
  const xy = tf.oneHot(targets, labels.length);

  const info = await model.fit(xs, xy, {
    epochs: 15,
    callbacks: {
      onEpochEnd: (epoch: number, logs?: tf.Logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs?.loss} accuracy = ${logs?.acc}`);
      },
    },
  });

  xs.dispose();
  xy.dispose();

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

