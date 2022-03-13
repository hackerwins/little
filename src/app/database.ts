import Dexie, { Table } from 'dexie';

export type Label = {
  name: string;
  images: Array<string>;
};

export type Dataset = {
  id?: number;
  labels: Array<Label>;
};

class MalteseDB extends Dexie {
  datasets!: Table<Dataset>;

  constructor() {
    super('malteseDB');

    this.version(1).stores({
      datasets: '++id',
    });
  }
}

export const db = new MalteseDB();
