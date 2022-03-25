import React from 'react';
import { NavLink as Link } from 'react-router-dom';

import { Summary as DatasetSummary } from '../features/dataset/Summary';
import { Summary as TrainingSummary } from '../features/model/Summary';
import { MenuItem as TrainingMenuItem } from '../features/model/MenuItem';

export function Sidebar() {
  const itemStyle = 'flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white';
  const activeStyle = 'bg-gray-100 dark:bg-gray-700';

  return (
    <aside className="flex-none w-64 bg-gray-50 dark:bg-gray-800" aria-label="Sidebar">
      <div className="overflow-y-auto py-4 px-3">
        <div className="flex pl-2.5 mb-5">
          <span className="self-center text-lg font-semibold whitespace-nowrap dark:text-white">Maltese</span>
        </div>
        <ul className="space-y-2">
          <li>
            <Link to="/labels" className={({ isActive }) => isActive ? `${itemStyle} ${activeStyle}` : itemStyle}>
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
              <span className="ml-3">Label</span>
            </Link>
          </li>
          <li>
            <Link to="/training" className={({ isActive }) => isActive ? `${itemStyle} ${activeStyle}` : itemStyle}>
              <TrainingMenuItem />
            </Link>
          </li>
          <li>
            <Link to="/use" className={({ isActive }) => isActive ? `${itemStyle} ${activeStyle}` : itemStyle}>
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <span className="ml-3">Use</span>
            </Link>
          </li>
        </ul>
        <DatasetSummary />
        <TrainingSummary />
      </div>
    </aside>
  );
}
