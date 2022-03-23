import * as tf from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';

import { db, Dataset, Model as ModelInfo } from '../../app/database';

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
  modelInfo: ModelInfo,
): Promise<void> {
  const tensor = await toTensor(encodedImage);
  const resultTensor = model.predict(tf.stack([tensor])) as tf.Tensor;
  const result = resultTensor.arraySync() as Array<Array<number>>;
  console.log(result);
}

// train creates a model and trains it on the given dataset.
export async function train(dataset: Dataset): Promise<[tf.LayersModel, tf.History]> {
  const baseModel = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
  );
  console.log('baseModel loaded');
  const labels = dataset.labels.filter((label) => !!label.name);

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

  const history = await model.fit(xs, xy, {
    epochs: 15,
    callbacks: {
      onEpochEnd: (epoch: number, logs?: tf.Logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs?.loss} accuracy = ${logs?.acc}`);
      },
    },
  });
  xs.dispose();

  return [model, history];
}

// saveModel saves a given model to the database.
export async function saveModel(
  model: tf.LayersModel,
  history: tf.History,
  dataset: Dataset,
): Promise<void> {
  const indexedDBKey = `indexeddb://maltiese-models-${uuidv4()}`;
  const labelNames = dataset.labels.filter((label) => !!label.name).map(label => label.name);

  await model.save(indexedDBKey);

  await db.models.put({
    datasetID: dataset.id!,
    labelNames,
    indexedDBKey,
  });
}

