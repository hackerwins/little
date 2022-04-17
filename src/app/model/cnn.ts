import * as tf from '@tensorflow/tfjs';

import {
  Dataset,
  TrainingLog,
  Prediction,
  ImagePrediction,
  filterLabels,
} from '../database';
import { createImage, toTensor, toHistory, toPrediction } from './utils';
import { Model } from './model';

const imageSize = 112;
const numChannels = 3;

// createCNN creates a new CNN model.
export function createCNN(): CNN {
  return new CNN();
}

// loadCNN loads a CNN model from the database.
export async function loadCNN(projectID: number): Promise<CNN> {
  const indexedDBKey = `indexeddb://maltiese-models-${projectID}`;
  const model = await tf.loadLayersModel(indexedDBKey);
  return new CNN(model);
}

// CNN is a convolutional neural network model for image classification.
export class CNN implements Model {
  private model?: tf.LayersModel;

  constructor(model?: tf.LayersModel) {
    this.model = model;
  }

  // train creates a model and trains it on the given dataset.
  public async train(dataset: Dataset): Promise<[Array<TrainingLog>, Prediction]> {
    const labels = filterLabels(dataset.labels);
    this.model = this.buildModel(labels.length);
  
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
    const info = await this.model.fit(xs, ys, {
      epochs: 15,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: [tf.callbacks.earlyStopping({
        monitor: 'acc', patience: 5,
      }), new tf.CustomCallback({
        onEpochEnd: (epoch: number, logs?: tf.Logs) => {
          const loss = logs?.loss.toFixed(5);
          const acc = logs?.acc.toFixed(5);
          const valLoss = logs?.val_loss.toFixed(5);
          const valAcc = logs?.val_acc.toFixed(5);
          // console.log(`Epoch ${epoch}: loss = ${loss} acc = ${acc}`);
          console.log(`Epoch ${epoch}: loss = ${loss} acc = ${acc} val_loss = ${valLoss} val_acc = ${valAcc}`);
        }
      })],
    });
  
    // 03. predict the given dataset.
    const yhats = this.model.predict(xs) as tf.Tensor;
    const preds = yhats.arraySync() as Array<ImagePrediction>;
  
    xs.dispose();
    ys.dispose();
    yhats.dispose();
  
    console.log('train:', tf.memory());
    return [
      toHistory(info),
      toPrediction(dataset, preds),
    ];
  }

  // predict predicts the class of a given image.
  public async predict(image: string): Promise<ImagePrediction> {
    const img = await createImage(image);
    const logit = tf.tidy(() => {
      const tensor = toTensor(img, imageSize, numChannels);
      const batched = tf.expandDims(tensor, 0);
      const yhat = this.model!.predict(batched) as tf.Tensor;
      const logits = yhat.arraySync() as Array<ImagePrediction>;
      return logits[0];
    });
    return logit;
  }

  // save saves the model with the given projectID.
  public async save(projectID: number): Promise<string> {
    const indexedDBKey = `indexeddb://maltiese-models-${projectID}`;
    await this.model!.save(indexedDBKey);
    return indexedDBKey;
  }

  // dispose disposes the model and its tensors.
  public dispose(): void {
    this.model?.dispose();
  }

  private buildModel(units: number): tf.Sequential {
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
}

