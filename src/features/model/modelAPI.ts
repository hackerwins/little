import * as tf from '@tensorflow/tfjs';
import {categoricalCrossentropy} from '@tensorflow/tfjs-layers/dist/exports_metrics';

import { Dataset, ImagePrediction, filterLabels } from '../../app/database';

// createImage creates a HTMLImageElement from a given base64 string.
function createImage(encodedImage: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = encodedImage;
  });
}

const imageSize = 224;

// toTensor converts a given image to a tensor.
function toTensor(imageElement: HTMLImageElement): tf.Tensor {
  return tf.tidy(() => {
    const image = tf.browser.fromPixels(imageElement);

    const inputMin = 0;
    const inputMax = 1;
    const normalizationConstant = (inputMax - inputMin) / 255.0;

    const normalized: tf.Tensor3D = tf.add(
      tf.mul(tf.cast(image, 'float32'), normalizationConstant),
      inputMin,
    );
    return tf.image.resizeBilinear(normalized, [imageSize, imageSize], true);
  });
}

// predictOnBatch predicts the class of the given images.
export async function predictOnBatch(
  encodedImages: Array<string>,
  model: tf.LayersModel,
): Promise<Array<ImagePrediction>> {
  const imageElements = await Promise.all(encodedImages.map(createImage));
  const logits = tf.tidy(() => {
    const tensors = imageElements.map(toTensor);
    const x = tf.stack(tensors);
    const yhat = model.predictOnBatch(x) as tf.Tensor<tf.Rank>;
    const logits = yhat.arraySync() as Array<ImagePrediction>;
    return logits;
  });

  console.log('predictOnBatch:', tf.memory());
  return logits;
}

// predict predicts the class of a given image.
export async function predict(
  encodedImage: string,
  model: tf.LayersModel,
): Promise<ImagePrediction> {
  const img = await createImage(encodedImage);
  const logit = tf.tidy(() => {
    const tensor = toTensor(img);
    const batched = tf.reshape(tensor, [-1, imageSize, imageSize, 3]);
    const yhat = model.predict(batched) as tf.Tensor;
    const logits = yhat.arraySync() as Array<ImagePrediction>;
    console.log(logits[0]);
    return logits[0];
  });

  console.log('predict:', tf.memory());
  return logit;
}

// train creates a model and trains it on the given dataset.
// The model is fine tuned model using mobileNetv1.
//   - https://github.com/eisbilen/TFJS-CustomImageClassification
//   - https://www.youtube.com/watch?v=Zrt76AIbeh4
export async function train(dataset: Dataset): Promise<[tf.LayersModel, tf.History]> {
  const labels = filterLabels(dataset.labels);

  // TODO(hackerwins): Cache base model to avoid downloading it every time.
  const baseModel = await tf.loadLayersModel(
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
  );

  // modifies the pre-trained mobilenet to classify the given dataset.
  // freezes layers to train only the last couple of layers.
  const pooling = baseModel.getLayer('global_average_pooling2d_1');
  const predictions = tf.layers.dense({
    name: 'dense_modified',
    units: labels.length,
    activation: 'softmax',
  }).apply(pooling.output) as tf.SymbolicTensor | tf.SymbolicTensor[];

  const model = tf.model({
    name: 'model_modified',
    inputs: baseModel.input,
    outputs: predictions,
  });
  
  // freeze mobilenet layers to make them untrainable
  // just keeps final layers trainable with argument trainablelayers
  const trainableLayers = [
    'conv_pw_12','conv_dw_12',
    'conv_pw_13','conv_dw_13',
    'dense_modified',
  ];

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

  model.summary();
  console.log('trainables:', model.layers.filter(layer => layer.trainable).map(layer => layer.name));

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

  const info = await model.fit(xs, ys, {
    epochs: 15,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch: number, logs?: tf.Logs) => {
        const loss = logs?.loss.toFixed(5);
        const acc = logs?.acc.toFixed(5);
        const valLoss = logs?.val_loss.toFixed(5);
        const valAcc = logs?.val_acc.toFixed(5);
        console.log(`Epoch ${epoch}: loss = ${loss} acc = ${acc} val_loss = ${valLoss} val_acc = ${valAcc}`);
      },
    },
  });

  xs.dispose();
  ys.dispose();
  console.log('train:', tf.memory());

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

