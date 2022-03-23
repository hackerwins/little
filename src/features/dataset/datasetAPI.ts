import { db, Dataset } from '../../app/database';

const initialDataset = {
  name: '',
  labels: [],
};

// initDataset initializes the test dataset for testing.
export async function initDataset(): Promise<void> {
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
