import React from 'react';

export function Summary() {
  return (
    <div className="p-4 mt-6 bg-gray-50 rounded dark:bg-gray-900" role="alert">
      <p className="mb-3 text-lg text-gray-900 dark:text-gray-400">
        <span className="font-bold text-green-400">100%</span> of your images are predicted correctly, you are ready to use!
      </p>
    </div>
  );
}
