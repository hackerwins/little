import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectDataset, fetchDatasetAsync } from './datasetSlice';

export function Summary() {
  const dataset = useAppSelector(selectDataset);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchDatasetAsync(1));
  }, [dispatch]);

  const total = dataset?.labels.reduce((acc, label) => acc + label.images.length, 0);
  const itemStyle = 'flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group';

  return (
    <ul className="pt-4 mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
      <li>
        <Link to="/labels" type="button" className={itemStyle}>
          <span className="flex-1 whitespace-nowrap">All Images</span>
          <span className="inline-flex justify-center items-center p-3 ml-3 w-3 h-3 text-sm font-medium">{total}</span>
        </Link>
      </li>
      {
        dataset?.labels.map((label, idx) => (
          <li key={idx}>
            <Link to={`/labels/${label.name}`} type="button" className={itemStyle}>
              <span className="flex-1 whitespace-nowrap">{label.name}</span>
              <span className="inline-flex justify-center items-center p-3 ml-3 w-3 h-3 text-sm font-medium">{label.images.length}</span>
            </Link>
          </li>
        ))
      }
    </ul>
  );
}
