import React from 'react';

import { useAppSelector } from '../../app/hooks';
import { selectHistory } from './modelSlice';

export function Summary() {
  const history = useAppSelector(selectHistory);
  if (!history) {
    return (
      <div className="p-4 mt-6 bg-gray-50 rounded dark:bg-gray-900" role="alert">
        <p className="mb-3 text-lg text-gray-900 dark:text-gray-400">
          <span className="font-bold text-green-400">5</span> images per label needed to start training.
        </p>
      </div>
    );
  }

  const accuracies = history.history.acc as Array<number>;
  const accuracy = Math.max(...accuracies) * 100;

  return (
    <div className="p-4 mt-6 bg-gray-50 rounded dark:bg-gray-900" role="alert">
      <p className="mb-3 text-lg text-gray-900 dark:text-gray-400">
        <span className="font-bold text-green-400">{accuracy.toFixed(2)}%</span> of your images are predicted correctly, you are ready to use!
      </p>
    </div>
  );
}
