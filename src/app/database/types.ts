// Project is the unit of work for labelling dataset and training models.
export type Project = {
  id: number;
  name: string;
}

// Image is a single image in a dataset.
export type Image = {
  src: string;
  createdAt: number;
}

// Label is the unit of data that has images and its name.
export type Label = {
  name: string;
  images: Array<Image>;
};

// Dataset is a collection of labels
export type Dataset = {
  projectID: number;
  labels: Array<Label>;
};

// ImagePrediction contains scores for each label for a single image.
export type ImagePrediction = Array<number>;

// LabelPrediction has predictions of images in the given label.
export type LabelPrediction = {
  label: string;
  images: Array<ImagePrediction>;
};

// Prediction is a collection of label predictions.
export type Prediction = {
  projectID: number;
  labels: Array<LabelPrediction>;
}

// filterLabels returns a label array without unlabeled label.
export function filterLabels(labels: Array<Label>): Array<Label> {
  return labels.filter(label => label.name !== 'Unlabeled');
}

// getLabel returns a label by name.
export function getMaxLabel(scores: ImagePrediction, labels: Array<Label>): [string, number] {
  const filteredLabels = filterLabels(labels);
  let maxLabel = '';
  let maxScore = 0;
  scores.forEach((score: number, idx: number) => {
    if (score > maxScore) {
      maxScore = score;
      maxLabel = filteredLabels[idx].name;
    }
  });
  return [maxLabel, maxScore];
}

// TrainingLog is the log of training process.
export type TrainingLog = {
  epoch: number;
  loss: number;
  accuracy: number;
}

// Model is the metadata of a trained model.
export type Model = {
  projectID: number;
  labelNames: Array<string>;
  history: Array<TrainingLog>;
  indexedDBKey: string;
  prediction: Prediction;
}

