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
  const correct = accuracies[accuracies.length - 1] * 100;
  const incorrect = 100 - correct;

  return (
    <div className="p-4 mt-6 bg-gray-50 rounded dark:bg-gray-900" role="alert">
      <p className="mb-3 text-lg text-gray-900 dark:text-gray-400">
        <span className="font-bold text-green-400">{correct.toFixed(0)}%</span> of your images are predicted correctly,
        <br />
        {
          incorrect > 0 ? (
            <>
              <span className="font-bold text-red-400">{incorrect.toFixed(0)}%</span> incorrectly.
            </>
          ) : <>you are ready to use!</>
        }
      </p>
    </div>
  );
}
