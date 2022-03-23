import Dexie, { Table } from 'dexie';

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
  indexedDBKey: string;
}

class MalteseDB extends Dexie {
  datasets!: Table<Dataset>;
  models!: Table<Model>;

  constructor() {
    super('malteseDB');

    this.version(1).stores({
      datasets: '++id',
      models: '++id',
    });
  }
}

export const db = new MalteseDB();
