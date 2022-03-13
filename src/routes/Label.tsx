import React from 'react';
import { Dataset } from '../features/dataset/Dataset';
import { Toolbar } from '../features/dataset/Toolbar';

export function Label() {
  return (
    <div className="pt-6 px-12 py-6 h-screen overflow-y-auto">
      <Toolbar />
      <Dataset />
    </div>
  );
}
