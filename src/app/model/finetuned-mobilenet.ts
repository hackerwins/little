import * as tf from '@tensorflow/tfjs';

import {
  Dataset,
  TrainingLog,
  Prediction,
  ImagePrediction,
  filterLabels,
} from '../database';

const imageSize = 224;
const inputMin = 0;
const inputMax = 1;

// Values read from images are in the range [0.0, 255.0], but they must
// be normalized to [min, max] before passing to the mobilenet classifier.
// Different implementations of mobilenet have different values of [min, max].
// We store the appropriate normalization parameters using these two scalars
// such that:
// out = (in / 255.0) * (inputMax - inputMin) + inputMin;
const normalizationConstant = (inputMax - inputMin) / 255.0;

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

    const resized = tf.image.resizeBilinear(image, [imageSize, imageSize], true);

    // Normalize the image from [0, 255] to [inputMin, inputMax].
    return tf.add(tf.mul(tf.cast(resized, 'float32'), normalizationConstant), inputMin);
  });
}

// predict predicts the class of a given image.
export async function predictAsync(
  encodedImage: string,
  model: tf.LayersModel,
): Promise<ImagePrediction> {
  const img = await createImage(encodedImage);
  const logit = tf.tidy(() => {
    const tensor = toTensor(img);
    const batched = tf.expandDims(tensor, 0);
    const yhat = model.predict(batched) as tf.Tensor;
    const logits = yhat.arraySync() as Array<ImagePrediction>;
    return logits[0];
  });
  // console.log('predict', logit);
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
      const tensor = toTensor(img);
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
    callbacks: [tf.callbacks.earlyStopping({
      monitor: 'acc', patience: 5,
    }), new tf.CustomCallback({
      onEpochEnd: (epoch: number, logs?: tf.Logs) => {
        const loss = logs?.loss.toFixed(5);
        const acc = logs?.acc.toFixed(5);
        const valLoss = logs?.val_loss.toFixed(5);
        const valAcc = logs?.val_acc.toFixed(5);
        console.log(`Epoch ${epoch}: loss = ${loss} acc = ${acc} val_loss = ${valLoss} val_acc = ${valAcc}`);
      }
    })],
  });

  // 03. predict the given dataset.
  const yhats = model.predict(xs) as tf.Tensor;
  const preds = yhats.arraySync() as Array<ImagePrediction>;

  // for (let i = 0; i < labels.length; i++) {
  //   for (const image of labels[i].images) {
  //     await predictAsync(image.src, model);
  //   }
  // }

  xs.dispose();
  ys.dispose();
  yhats.dispose();

  console.log('train:', tf.memory());

  // create history.
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

  return [model, history, prediction];
}


