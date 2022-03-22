import React from 'react';

import { Navigator } from '../components/navigator/Navigator';
import { Summary as DatasetSummary } from '../features/dataset/Summary';
import { Summary as TrainingSummary } from '../features/model/Summary';

export function Sidebar() {

  return (
    <aside className="flex-none w-64 bg-gray-50 dark:bg-gray-800" aria-label="Sidebar">
      <div className="overflow-y-auto py-4 px-3">
        <div className="flex pl-2.5 mb-5">
          <span className="self-center text-lg font-semibold whitespace-nowrap dark:text-white">Maltese</span>
        </div>
        <Navigator />
        <DatasetSummary />
        <TrainingSummary />
      </div>
    </aside>
  );
}
