import Dexie, { Table } from 'dexie';

import { Dataset, Model } from './types';

// MalteseDB is a Dexie database that stores the data for Maltese.
class MalteseDB extends Dexie {
  datasets!: Table<Dataset>;
  models!: Table<Model>;

  constructor() {
    super('malteseDB');

    this.version(1).stores({
      datasets: 'projectID',
      models: 'projectID',
    });
  }
}

export * from './types';
export const db = new MalteseDB();

// initDataset initializes the dataset for the given project.
async function initDataset(projectID: number): Promise<void> {
  const dataset = await db.datasets.where('projectID').equals(projectID).first();
  if (!dataset) {
    await db.datasets.put({
      projectID,
      labels: [{
        name: 'Unlabeled',
        images: [],
      }],
    });
  }
}

// findDataset returns the dataset from the database.
export async function findDataset(projectID: number): Promise<{data: Dataset}> {
  await initDataset(projectID);
  const dataset = await db.datasets.where('projectID').equals(projectID).first();
  if (dataset) {
    return { data: dataset };
  }

  throw new Error('Dataset not found');
}

// findModel returns the model from the database.
export async function findModel(projectID: number): Promise<{data: Model}> {
  const model = await db.models.where('projectID').equals(projectID).first();
  if (model) {
    return { data: model };
  }

  throw new Error('Model not found');
}

// addImageToDataset adds an image to a dataset.
export async function addImageToDataset(
  id: number,
  label: string,
  image: string,
): Promise<void> {
  await db.datasets.where('projectID').equals(id).modify((dataset) => {
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

