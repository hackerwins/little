import React from 'react';
import { Link } from 'react-router-dom';

export function Toolbar() {
  return (
    <div className="flex w-full h-12">
      <div className="flex-1">
        <h1 className="text-2xl font-bold">Import</h1>
      </div>
      <Link to="/" type="button" className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center mr-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
        Done
      </Link>
    </div>
  );
}

