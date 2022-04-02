import * as tf from '@tensorflow/tfjs';

import {
  Dataset,
  TrainingLog,
  Prediction,
  ImagePrediction,
  filterLabels,
} from '../database';
import { createImage, toTensor, toHistory, toPrediction } from './utils';

const imageSize = 112;
const numChannels = 3;

function buildModel(units: number) {
  const model = tf.sequential();

  // In the first layer of our convolutional neural network we have
  // to specify the input shape. Then we specify some parameters for
  // the convolution operation that takes place in this layer.
  model.add(tf.layers.conv2d({
    inputShape: [imageSize, imageSize, numChannels],
    kernelSize: 5,
    filters: 8,
    strides: 1,
    activation: 'relu',
    kernelInitializer: 'varianceScaling'
  }));

  // The MaxPooling layer acts as a sort of downsampling using max values
  // in a region instead of averaging.
  model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));

  // Repeat another conv2d + maxPooling stack.
  // Note that we have more filters in the convolution.
  model.add(tf.layers.conv2d({
    kernelSize: 5,
    filters: 16,
    strides: 1,
    activation: 'relu',
    kernelInitializer: 'varianceScaling'
  }));
  model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));

  // Now we flatten the output from the 2D filters into a 1D vector to prepare
  // it for input into our last layer. This is common practice when feeding
  // higher dimensional data to a final classification output layer.
  model.add(tf.layers.flatten());

  // Our last layer is a dense layer which has classes output units, one for each
  // output class.
  model.add(tf.layers.dense({
    units,
    kernelInitializer: 'varianceScaling',
    activation: 'softmax'
  }));

  // Choose an optimizer, loss function and accuracy metric,
  // then compile and return the model
  const optimizer = tf.train.adam();
  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  model.summary();

  return model;
}

// predict predicts the class of a given image.
export async function predictAsync(
  encodedImage: string,
  model: tf.LayersModel,
): Promise<ImagePrediction> {
  const img = await createImage(encodedImage);
  const logit = tf.tidy(() => {
    const tensor = toTensor(img, imageSize, numChannels);
    const batched = tf.expandDims(tensor, 0);
    const yhat = model.predict(batched) as tf.Tensor;
    const logits = yhat.arraySync() as Array<ImagePrediction>;
    return logits[0];
  });
  return logit;
}

// train creates a model and trains it on the given dataset.
export async function trainAsync(
  dataset: Dataset
): Promise<[tf.LayersModel, Array<TrainingLog>, Prediction]> {
  const labels = filterLabels(dataset.labels);

  // TODO(hackerwins): introduce dataset
  // 01. create xs, ys from the given dataset.
  const tensors: Array<tf.Tensor> = [];
  const targets: Array<number> = [];
  for (let i = 0; i < labels.length; i++) {
    for (const image of labels[i].images) {
      const img = await createImage(image.src);
      const tensor = toTensor(img, imageSize, numChannels);
      tensors.push(tensor);
      targets.push(i);
    }
  }
  const ys = tf.oneHot(targets, labels.length);
  const xs = tf.stack(tensors);
  for (const tensor of tensors) {
    tensor.dispose();
  }

  // 02. create model and train it.
  const model = await buildModel(labels.length);
  const info = await model.fit(xs, ys, {
    epochs: 15,
    // validationSplit: 0.2,
    shuffle: true,
    callbacks: [tf.callbacks.earlyStopping({
      monitor: 'acc', patience: 5,
    }), new tf.CustomCallback({
      onEpochEnd: (epoch: number, logs?: tf.Logs) => {
        const loss = logs?.loss.toFixed(5);
        const acc = logs?.acc.toFixed(5);
        // const valLoss = logs?.val_loss.toFixed(5);
        // const valAcc = logs?.val_acc.toFixed(5);
        console.log(`Epoch ${epoch}: loss = ${loss} acc = ${acc}`);
        // console.log(`Epoch ${epoch}: loss = ${loss} acc = ${acc} val_loss = ${valLoss} val_acc = ${valAcc}`);
      }
    })],
  });

  // 03. predict the given dataset.
  const yhats = model.predict(xs) as tf.Tensor;
  const preds = yhats.arraySync() as Array<ImagePrediction>;

  xs.dispose();
  ys.dispose();
  yhats.dispose();

  console.log('train:', tf.memory());
  return [
    model,
    toHistory(info),
    toPrediction(dataset, preds),
  ];
}

