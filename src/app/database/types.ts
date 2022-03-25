// Label is the unit of data that has images and its name.
export type Label = {
  name: string;
  images: Array<string>;
};

// Dataset is a collection of labels
export type Dataset = {
  id?: number;
  labels: Array<Label>;
};

// filterLabels returns a label array without unlabeled label.
export function filterLabels(labels: Array<Label>): Array<Label> {
  return labels.filter(label => label.name !== 'Unlabeled');
}

export type Model = {
  id?: number;
  datasetID: number;
  labelNames: Array<string>;
  history?: Array<{
    epoch: number;
    loss: number;
    accuracy: number;
  }>;
  indexedDBKey: string;
}

