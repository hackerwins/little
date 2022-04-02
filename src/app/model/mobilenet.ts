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

// buildModel creates a fine-tuned mobilenet.
// The model is fine tuned model using mobileNetv1.
//   - https://github.com/eisbilen/TFJS-CustomImageClassification
//   - https://www.youtube.com/watch?v=Zrt76AIbeh4
async function buildModel(units: number) {
  // TODO(hackerwins): Cache base model to avoid downloading it every time.
  const baseModel = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.50_224/model.json'
  );

  // modifies the pre-trained mobilenet to classify the given dataset.
  // freezes layers to train only the last couple of layers.
  const pooling = baseModel.getLayer('global_average_pooling2d_1');
  const predictions = tf.layers.dense({
    name: 'dense_modified',
    units,
    activation: 'softmax',
  }).apply(pooling.output) as tf.SymbolicTensor | tf.SymbolicTensor[];

  const model = tf.model({
    name: 'model_modified',
    inputs: baseModel.input,
    outputs: predictions,
  });

  // freeze mobilenet layers to make them untrainable
  // just keeps final layers trainable with argument trainablelayers
  const trainableLayers = ['conv_pw_13','conv_dw_13', 'dense_modified'];
  for (const layer of model.layers) {
    layer.trainable = false;
    for (const trainableLayer of trainableLayers) {
      if (layer.name.indexOf(trainableLayer) === 0) {
        layer.trainable = true;
        break;
      }
    }
  }

  model.compile(
    // {loss: 'categoricalCrossentropy', optimizer: 'sgd', metrics: ['acc']}
    {loss: 'categoricalCrossentropy', optimizer: 'adam', metrics: ['acc', 'ce']}
  );

  model.summary();
  console.log('trainables:', model.layers.filter(layer => layer.trainable).map(layer => layer.name));

  return model;
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
  // TODO(hackerwins): find the reason why the prediction is not same with the
  // batch prediction in mobilenet.
  const yhats = model.predict(xs) as tf.Tensor;
  const preds = yhats.arraySync() as Array<ImagePrediction>;

  // const preds2: Array<ImagePrediction> = [];
  // tf.unstack(xs).forEach((tensor, i) => {
  //   const pred = tf.tidy(() => {
  //     const pred = model.predict(tensor.expandDims(0)) as tf.Tensor;
  //     const logits = pred.arraySync() as Array<ImagePrediction>;
  //     return logits[0];
  //   });
  //   preds2.push(pred);
  // });
  // preds.forEach((pred, i) => {
  //   console.log(pred, preds2[i]);
  // });

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

