import * as tf from '@tensorflow/tfjs';

import { Dataset } from '../../app/database';

function createImage(encodedImage: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = encodedImage;
  });
}

function toTensor(imageElement: HTMLImageElement): tf.Tensor {
  const image = tf.browser.fromPixels(imageElement);
  const resized = tf.image.resizeNearestNeighbor(image, [224, 224]);
  return resized.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
}

export async function train(dataset: Dataset): Promise<tf.History> {
  const baseModel = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
  );
  const labels = dataset.labels;

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
    optimizer: 'sgd',
    metrics: ['accuracy', 'crossentropy'],
  });

  const tensors: Array<tf.Tensor> = [];
  const targets: Array<number> = [];
  for (let i = 0; i < labels.length; i++) {
    for (const encoded of labels[i].images) {
      const image = await createImage(encoded);
      const tensor = toTensor(image);
      tensors.push(tensor);
      targets.push(i);
    }
  }
  const xs = tf.stack(tensors);
  const xy = tf.oneHot(targets, labels.length);

  const historyInfo = await model.fit(xs, xy, { epochs: 15 });
  xs.dispose();

  return historyInfo;
}

