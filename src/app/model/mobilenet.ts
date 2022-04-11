import * as tf from '@tensorflow/tfjs';

import {
  Dataset,
  TrainingLog,
  Prediction,
  ImagePrediction,
  filterLabels,
} from '../database';
import { createImage, toTensor, toHistory, toPrediction } from './utils';

const imageSize = 224;
const numChannels = 3;

// createCustomMobileNet creates a new CustomMobileNet.
export async function createCustomMobileNet(): Promise<CustomMobileNet> {
  const mobileNet = new CustomMobileNet();
  await mobileNet.initialize();
  return mobileNet;
}

// loadCustomMobileNet loads a CustomMobileNet.
export async function loadCustomMobileNet(projectID: number): Promise<CustomMobileNet> {
  const indexedDBKey = `indexeddb://maltiese-models-${projectID}`;
  const model = await tf.loadLayersModel(indexedDBKey);
  const mobileNet = new CustomMobileNet(model);
  await mobileNet.initialize();
  return mobileNet;
}

export class CustomMobileNet {
  private truncatedModel?: tf.LayersModel;
  private trainingModel?: tf.LayersModel;

  constructor(
    trainingModel?: tf.LayersModel,
  ) {
    this.trainingModel = trainingModel;
  }

  public async initialize(): Promise<void> {
    const mobilenet = await tf.loadLayersModel(
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
    );

    const cutoffLayer = mobilenet.getLayer('conv_pw_13_relu');
    this.truncatedModel = tf.model({
      inputs: mobilenet.inputs,
      outputs: cutoffLayer.output,
    });
  }

  // train creates a model and trains it on the given dataset.
  public async train(dataset: Dataset): Promise<[Array<TrainingLog>, Prediction]> {
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
    const model = await this.buildModel(labels.length);

    const activation = this.truncatedModel!.predict(xs) as tf.Tensor;
    const info = await model.fit(activation, ys, {
      epochs: 50,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: [new tf.CustomCallback({
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
    const yhats = model.predict(activation) as tf.Tensor;
    const preds = yhats.arraySync() as Array<ImagePrediction>;

    activation.dispose();
    xs.dispose();
    ys.dispose();
    yhats.dispose();

    this.trainingModel = model;

    console.log('train:', tf.memory());
    return [
      toHistory(info),
      toPrediction(dataset, preds),
    ];
  }

  public async save(projectID: number): Promise<string> {
    const indexedDBKey = `indexeddb://maltiese-models-${projectID}`;
    await this.trainingModel!.save(indexedDBKey);
    return indexedDBKey;
  }

  // dispose disposes the model and its tensors.
  public dispose(): void {
    this.truncatedModel?.dispose();
    this.trainingModel?.dispose();
  }

  // predict predicts the class of a given image.
  public async predict(image: string): Promise<ImagePrediction> {
    const img = await createImage(image);
    const logit = tf.tidy(() => {
      const tensor = toTensor(img, imageSize, numChannels);
      const batched = tf.expandDims(tensor, 0);
      const activation = this.truncatedModel!.predict(batched);
      const yhat = this.trainingModel!.predict(activation) as tf.Tensor;
      const logits = yhat.arraySync() as Array<ImagePrediction>;
      return logits[0];
    });
    return logit;
  }

  private async buildModel(units: number): Promise<tf.Sequential> {
    const model = tf.sequential();

    model.add(tf.layers.flatten({
      inputShape: this.truncatedModel!.outputs[0].shape.slice(1),
    }));

    model.add(tf.layers.dense({
      units: 20,
      activation: 'relu',
    }));

    model.add(tf.layers.dense({
      units: units,
      activation: 'softmax',
    }));

    model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: tf.train.adam(0.001),
      metrics: ['acc'],
    });

    return model;
  }
}

