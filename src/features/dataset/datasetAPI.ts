import { db, Dataset } from '../../app/database';
import { testDataset } from './testDataset';

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
