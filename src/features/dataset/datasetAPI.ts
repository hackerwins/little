import { db, Dataset } from '../../app/database';
import { testDataset } from './testDataset';

// initDataset initializes the test dataset for testing.
export function initDataset() {
  return new Promise<void>((resolve, reject) => {
    db.datasets.count().then((count) => {
      if (count === 0) {
        db.datasets.put(testDataset).then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
      } else {
        resolve();
      }
    }).catch((err) => {
      reject(err);
    });
  });
}

// fetchDataset fetches a dataset from the database.
export function fetchDataset(id: number) {
  return new Promise<{ data: Dataset }>((resolve, reject) => {
    initDataset().then(() => {
      return db.datasets.where('id').equals(id).first();
    }).then((dataset) => {
      if (dataset) {
        resolve({ data: dataset });
      } else {
        reject(new Error('Dataset not found'));
      }
    });
  });
}

// addImageToDataset adds an image to a dataset.
export function addImageToDataset(id: number, label: string, image: string) {
  return new Promise<void>((resolve, reject) => {
    initDataset().then(() => {
      return db.datasets.where('id').equals(id).modify((dataset) => {
        for (const l of dataset.labels) {
          if (l.name === label) {
            l.images.push(image);
          }
        }
      });
    }).then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
}
