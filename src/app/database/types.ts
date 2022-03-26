// Project is the unit of work for labelling dataset and training models.
export type Project = {
  id: number;
  name: string;
}

// Label is the unit of data that has images and its name.
export type Label = {
  name: string;
  images: Array<string>;
};

// Dataset is a collection of labels
export type Dataset = {
  projectID: number;
  labels: Array<Label>;
};

// filterLabels returns a label array without unlabeled label.
export function filterLabels(labels: Array<Label>): Array<Label> {
  return labels.filter(label => label.name !== 'Unlabeled');
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
  history?: Array<TrainingLog>;
  indexedDBKey: string;
}

