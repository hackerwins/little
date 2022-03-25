export type Label = {
  name: string;
  images: Array<string>;
};

export type Dataset = {
  id?: number;
  labels: Array<Label>;
};

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

