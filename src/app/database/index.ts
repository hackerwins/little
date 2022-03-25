import Dexie, { Table } from 'dexie';

import { Dataset, Model } from './types';

// MalteseDB is a Dexie database that stores the data for Maltese.
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

export * from './types';
export const db = new MalteseDB();

// initialDataset is the initial data of dataset.
const initialDataset = {
  name: '',
  labels: [{
    name: 'Unlabeled',
    images: [],
  }],
};

// initDataset initializes the test dataset.
async function initDataset(): Promise<void> {
  const count = await db.datasets.count();
  if (count === 0) {
    await db.datasets.put(initialDataset);
  }
}

// fetchDataset fetches a dataset from the database.
export async function fetchDataset(id: number): Promise<{ data: Dataset}> {
  await initDataset();
  const dataset = await db.datasets.where('id').equals(id).first();
  if (dataset) {
    return { data: dataset };
  }

  throw new Error('Dataset not found');
}

// addImageToDataset adds an image to a dataset.
export async function addImageToDataset(
  id: number,
  label: string,
  image: string,
): Promise<void> {
  await initDataset();
  await db.datasets.where('id').equals(id).modify((dataset) => {
    for (const l of dataset.labels) {
      if (l.name === label) {
        l.images.push(image);
        return;
      }
    }

    dataset.labels.push({
      name: label,
      images: [image],
    });
  });
}

// putModel upserts the given model in the database.
export async function putModel(model: Model): Promise<void> {
  await db.models.put(model);
}

